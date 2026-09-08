#!/bin/bash
cd "$(dirname "$0")"

if [ ! -t 0 ]; then
    if command -v xdg-terminal-exec >/dev/null 2>&1; then
        exec xdg-terminal-exec bash -c "\"$0\" \"$@\""
    elif command -v x-terminal-emulator >/dev/null 2>&1; then
        exec x-terminal-emulator -e "bash -c '\"$0\" \"$@\"'"
    elif command -v gnome-terminal >/dev/null 2>&1; then
        exec gnome-terminal -- bash -c "\"$0\" \"$@\""
    elif command -v ptyxis >/dev/null 2>&1; then
        exec ptyxis -- bash -c "\"$0\" \"$@\""
    elif command -v konsole >/dev/null 2>&1; then
        exec konsole -e bash -c "\"$0\" \"$@\""
    elif command -v xterm >/dev/null 2>&1; then
        exec xterm -e "bash -c '\"$0\" \"$@\"'"
    fi
fi

echo "=================================================="
echo "    🎮 تشغيل لعبة المشنقة وتخمين الكلمة المصورة   "
echo "=================================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting game server and opening browser..."
# Open browser automatically with --open
npm run dev -- --open --host 0.0.0.0 --port 5173

read -p "Press Enter to exit..."
