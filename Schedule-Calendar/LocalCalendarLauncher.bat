@echo off
setlocal EnableExtensions

set "APP_NAME=Schedule - Calendar"
set "LNK_NAME=%APP_NAME%.lnk"

set "APP_DIR=%~dp0"
if "%APP_DIR:~-1%"=="\" set "APP_DIR=%APP_DIR:~0,-1%"

set "INDEX=%APP_DIR%\index.html"
if not exist "%INDEX%" (
  echo [ERROR] index.html not found:
  echo         "%INDEX%"
  echo Put this bat and index.html in the same folder and try again.
  echo.
  pause
  exit /b 1
)

set "ICON_FILE=%APP_DIR%\calendar.ico"
if not exist "%ICON_FILE%" (
  set "ICON_FILE=%SystemRoot%\System32\shell32.dll,44"
)

set "DESKTOP="
for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')" 2^>nul`) do set "DESKTOP=%%D"
if not defined DESKTOP set "DESKTOP=%USERPROFILE%\Desktop"

set "LNK_PATH=%DESKTOP%\%LNK_NAME%"

if not exist "%LNK_PATH%" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$lnk='%LNK_PATH%'; $target='%INDEX%'; $icon='%ICON_FILE%'; $wd='%APP_DIR%';" ^
    "$ws=New-Object -ComObject WScript.Shell; $sc=$ws.CreateShortcut($lnk);" ^
    "$sc.TargetPath=$target;" ^
    "$sc.WorkingDirectory=$wd;" ^
    "if($icon){$sc.IconLocation=$icon};" ^
    "$sc.Description='Schedule - Calendar (Local)';" ^
    "$sc.Save()" >nul 2>&1
)

start "" "%INDEX%"

echo.
echo Done.
pause >nul
exit /b 0
