@echo off
cd /d "%~dp0"
echo ==================================================
echo     🎮 تشغيل لعبة المشنقة وتخمين الكلمة المصورة
echo ==================================================
if not exist node_modules (
    echo Installing dependencies...
    npm install
)
npm run dev -- --open
pause
