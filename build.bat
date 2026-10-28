@echo off
setlocal
py "%~dp0tools\build_site.py" %*
if errorlevel 1 exit /b 1
