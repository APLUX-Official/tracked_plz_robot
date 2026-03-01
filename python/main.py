# SPDX-FileCopyrightText: Copyright (C) ARDUINO SRL (http://www.arduino.cc)
# SPDX-License-Identifier: MPL-2.0

from arduino.app_utils import App, Bridge
from arduino.app_bricks.web_ui import WebUI
from arduino.app_bricks.video_objectdetection import VideoObjectDetection

ui = WebUI()
detection = VideoObjectDetection(confidence=0.5)

# === 全局变量 ===
# 默认速度设为 150 (中速)
current_speed = 150 

# AI 回显
def on_detect(detections):
    content = list(detections.keys())
    if content:
        ui.send_message("ai_result", {"objects": content})
detection.on_detect_all(on_detect)

# === 速度设置回调 ===
def set_speed(sid, value):
    global current_speed
    try:
        # 限制在 0-255 之间
        val = int(value)
        current_speed = max(0, min(255, val))
        print(f"⚙️ Speed set to: {current_speed}", flush=True)
    except:
        pass

# === 车轮控制 ===
def move_car(cmd):
    global current_speed
    sl, sr = 0, 0
    
    # 使用全局变量 current_speed 代替固定值
    SPEED = current_speed 
    
    if cmd == 'up':    
        sl, sr = SPEED, SPEED
    elif cmd == 'down': 
        sl, sr = -SPEED, -SPEED
    elif cmd == 'left': 
        sl, sr = -SPEED, SPEED  
    elif cmd == 'right': 
        sl, sr = SPEED, -SPEED 
    elif cmd == 'stop': 
        sl, sr = 0, 0

    Bridge.call("motor_l", sl)
    Bridge.call("motor_r", sr)

# 注册事件监听
ui.on_message('move', lambda sid, data: move_car(data))
ui.on_message('speed', set_speed) # 新增速度监听
ui.on_message('pan', lambda sid, val: Bridge.call("servo_pan", int(val)))
ui.on_message('tilt', lambda sid, val: Bridge.call("servo_tilt", int(val)))

print("🚀 FPV Robot Ready with Speed Control", flush=True)
App.run()