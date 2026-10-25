@echo off
setlocal
py -m pip show Pillow >nul 2>&1 || py -m pip install Pillow
py "%~dp0prepare_images.py" --site "%~dp0.." %*
