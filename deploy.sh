#!/bin/bash
pkill -9 -f "next" 2>/dev/null
sleep 1
npm run build && npm start
