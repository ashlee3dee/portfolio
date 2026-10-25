"""Render A3D geometry studies with Blender."""
import sys
from pathlib import Path
import json
import math
import bpy

ROOT = Path(__file__).resolve().parents[1]
TOOLKIT = Path(r'T:\Art\Blender Projects\Gumroad Products\a3d_procgen_toolkit')
sys.path[:0] = [str(TOOLKIT / '.blender_libs'), str(TOOLKIT)]
from nodegroups.a3d_wavefront_offset import A3DWavefrontOffset
from nodegroups.a3d_straight_skeleton import A3DStraightSkeleton

OUT = ROOT / '.media-tools' / 'geometry'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Split the concave outline at its narrow neck.
polygon = [(-3,-2), (0,-2), (0,-.6), (1.4,-.6), (1.4,-1.7),
           (4,-1.7), (4,2), (1.4,2), (1.4,.6), (0,.6), (0,2.6), (-3,2.6)]
curve = bpy.data.curves.new('Source polygon', 'CURVE')
curve.dimensions = '3D'
sp = curve.splines.new('POLY')
sp.points.add(len(polygon)-1)
for p, xy in zip(sp.points, polygon):
    p.co = (*xy, 0, 1)
sp.use_cyclic_u = True
source = bpy.data.objects.new('Input outline', curve)
bpy.context.collection.objects.link(source)
source.hide_render = True

def harness(cls, curves=False):
    group = cls.create_group()
    tree = bpy.data.node_groups.new('Render evaluation ' + group.name, 'GeometryNodeTree')
    tree.interface.new_socket(name='Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    info = tree.nodes.new('GeometryNodeObjectInfo')
    info.inputs['Object'].default_value = source
    node = tree.nodes.new('GeometryNodeGroup')
    node.node_tree = group
    tree.links.new(info.outputs['Geometry'], node.inputs['Curve'])
    output = tree.nodes.new('NodeGroupOutput')
    if curves:
        convert = tree.nodes.new('GeometryNodeCurveToMesh')
        tree.links.new(node.outputs['Curves'], convert.inputs['Curve'])
        tree.links.new(convert.outputs['Mesh'], output.inputs['Geometry'])
    else:
        tree.links.new(node.outputs['Skeleton'], output.inputs['Geometry'])
    mesh = bpy.data.meshes.new('Evaluation host')
    host = bpy.data.objects.new(tree.name, mesh)
    bpy.context.collection.objects.link(host)
    mod = host.modifiers.new('Actual toolkit graph', 'NODES')
    mod.node_group = tree
    host.hide_render = True
    print('HARNESS', group.name, 'nodes', len(group.nodes), 'wrapper links', len(tree.links), flush=True)
    return host, node

def evaluate(host):
    bpy.context.view_layer.update()
    mesh = host.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
    vertices = [tuple(v.co) for v in mesh.vertices]
    edges = [tuple(e.vertices) for e in mesh.edges]
    offsets = [v.value for v in mesh.attributes['offset'].data] if 'offset' in mesh.attributes else []
    host.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh_clear()
    return vertices, edges, offsets

wave, wave_node = harness(A3DWavefrontOffset, True)
skel, skel_node = harness(A3DStraightSkeleton)
skel_node.inputs['Include Boundary'].default_value = False
sv, se, so = evaluate(skel)
assert len(se) and len(so) == len(sv), 'Skeleton must contain edges and event offsets'
assert all(math.isfinite(c) for v in sv for c in v)
print('SKELETON', len(sv), 'points', len(se), 'edges', 'max offset', max(so), flush=True)

def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    return mat

ink = material('Ink', (.009, .010, .008))
red = material('Signal red', (.847, .029, .018))
grey = material('Outline', (.44, .45, .40))

def lines(name, segments, mat, radius):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.bevel_depth = radius
    data.bevel_resolution = 2
    for a,b in segments:
        spline = data.splines.new('POLY')
        spline.points.add(1)
        spline.points[0].co = (*a,1)
        spline.points[1].co = (*b,1)
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    data.materials.append(mat)
    return obj

boundary = [((x,y,0),(*polygon[(i+1)%len(polygon)],0)) for i,(x,y) in enumerate(polygon)]
lines('Original boundary', boundary, grey, .012)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'FLAT'
scene.display.shading.color_type = 'MATERIAL'
scene.display.shading.show_shadows = False
scene.display.shading.show_cavity = False
scene.display.shading.show_specular_highlight = False
scene.display.shading.background_type = 'WORLD'
scene.world.color = (.88,.871,.839)
scene.view_settings.view_transform = 'Standard'
scene.render.resolution_x = 1200
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.fps = 24
bpy.ops.object.camera_add(location=(.5,.3,15))
scene.camera = bpy.context.object
scene.camera.data.type = 'ORTHO'
scene.camera.data.ortho_scale = 9.3
frames = []
dynamic = []
for frame in range(144):
    for obj in dynamic:
        data = obj.data
        bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.curves.remove(data)
    # Pause on the completed skeleton before looping.
    t = max(0, min(1, (frame-12)/108)) * (max(so) + .06)
    wave_node.inputs['Distance'].default_value = t
    wave_node.id_data.update_tag()
    wv,we,_ = evaluate(wave)
    assert all(math.isfinite(c) for v in wv for c in v)
    traces = []
    for a,b in se:
        if so[a] > so[b]: a,b = b,a
        if t < so[a]: continue
        u = min(1, (t-so[a])/max(so[b]-so[a], 1e-9))
        end = tuple(sv[a][i] + u*(sv[b][i]-sv[a][i]) for i in range(3))
        traces.append((sv[a],end))
    dynamic = [lines('Skeleton traces', traces, ink, .022),
               lines('Moving wavefront', [(wv[a],wv[b]) for a,b in we], red, .035)]
    frames.append({'distance':round(t,6),'vertices':wv,'edges':we})
    scene.render.filepath = str(OUT / f'{frame:04d}.png')
    bpy.ops.render.render(write_still=True)
    print('FRAME',frame,'offset',round(t,3),'edges',len(we),flush=True)
(OUT/'evaluation.json').write_text(json.dumps({'polygon':polygon,'skeleton':{'vertices':sv,'edges':se,'offsets':so},'frames':frames}))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'wavefront-study.blend'))
