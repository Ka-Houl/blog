@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   3v3.top 离线站点本地服务
echo   --------------------------------
echo   正在启动 http://127.0.0.1:8899
echo   关闭本窗口即可停止服务
echo.
start "" http://127.0.0.1:8899/index.html
python -m http.server 8899 --bind 127.0.0.1
if errorlevel 1 (
  echo.
  echo   python 启动失败，正在尝试 py 命令...
  py -3 -m http.server 8899 --bind 127.0.0.1
)
pause
