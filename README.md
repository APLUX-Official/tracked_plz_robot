# 🤖 Household Pet Monitoring Robot

## 1. Project Overview

This project builds an FPV desktop monitoring robot based on the **Arduino Uno Q**. It features real-time video transmission, AI object recognition, 2-axis gimbal control, and speed-adjustable omnidirectional movement.

**Core Highlights**:

* **Web Full-Stack Architecture**: Separated HTML/CSS/JS front-end with a clear structure.
* **Cyberpunk-Style Dashboard**: Responsive UI with a three-column layout on desktop, automatically optimized for mobile portrait mode.
* **Hybrid Drive Underlayer**: Resolves Arduino timer conflicts while achieving servo image stabilization and smooth motor speed regulation.
* **Offline Operation Support**: Localized front-end resources enable smooth control within the local area network (LAN) without external internet access.
* **Automatic Reconnection Under Weak Network**: Built-in reconnection mechanism for network disconnections. Control can be automatically restored after mobile phone or robot WiFi disconnection, with real-time connection status indicated by the status light.

---

## 2. Project File Structure

The project adopts a front-end and back-end separated file organization for easy maintenance:

```text
tracked_plz/
├── sketch/
│   └── sketch.ino       # Arduino underlying firmware (C++)
├── python/
│   └── main.py          # Python middle-tier logic (Socket.IO/Bridge/AI)
├── assets/              # Front-end static resources
│   ├── index.html       # Web page skeleton (Title: Desktop Monitoring Robot)
│   ├── style.css        # Stylesheet (including portrait layout optimization)
│   ├── script.js        # Interaction logic (Socket communication/debouncing)
│   └── socket.io.min.js # Local dependency library (recommended to download and place here)
└── README.md            # Project documentation
```

## 3. Hardware Architecture & Wiring

| Component       | Model                | Arduino Pin | Description                                                  |
| --------------- | -------------------- | ----------- | ------------------------------------------------------------ |
| Main Controller | Arduino Uno Q        | -           | Based on STM32/Zephyr                                        |
| Motor Driver    | A4950 (Dual Channel) | -           | Requires external 7.4V-12V lithium battery                   |
| Left Motor      | Gear Motor           | D5, D6      | Controls left track                                          |
| Right Motor     | Gear Motor           | D9, D10     | Controls right track (reverse correction implemented in the underlying layer) |
| Gimbal Pan      | SG90 Servo           | D3          | Horizontal rotation (0-180°)                                 |
| Gimbal Tilt     | SG90 Servo           | D11         | Vertical nodding (limited to 60-120°, midpoint at 90°)       |
| Camera          | USB Cam              | USB Port    | Video stream port: 49124                                     |

## 4. Software Architecture Analysis

### 4.1 Front-End (Assets)

- **Layout Logic (style.css)**: Desktop/tablet: Three-column layout (left: driving - middle: video - right: gimbal). Mobile portrait: Forced reordering to video (top) → gimbal (middle) → driving (bottom), conforming to one-handed operation habits.
- **Interaction Logic (script.js)**: Safety mechanisms: Listens to `touchcancel` and `mouseleave` events to prevent car runaway when fingers slide out of buttons. Offline-first: Prioritizes loading local `socket.io.min.js` for operation in network-free environments. Weak network reconnection: Socket.IO automatic reconnection with real-time connection status display on the UI (ONLINE/Reconnecting/Reconnection Failed).

### 4.2 Middle-Tier (Python)

- **Speed Management**: Maintains a global `current_speed` variable to receive slider values (50-255) from the front-end.
- **Command Routing**: Converts semantic commands (up, stop) from the front-end into underlying motor parameters.
- **AI Vision**: Runs object detection in the background and pushes recognition results (e.g., [TARGET] person) in real-time via Socket.

### 4.3 Underlayer (C++)

Adopts a "Hybrid Drive Mode" to resolve resource conflicts:

- **SG90 Servos**: Uses the hardware `<Servo.h>` library, occupying timers to ensure gimbal stability (no jitter).
- **DC Motors**: Uses non-blocking software PWM (based on `micros()`), avoiding the failure of hardware PWM on D9/D10 pins and achieving smooth speed regulation.

## 5. User Guide

Access the console via a browser at `http://<Robot IP>:7000`.

### 🎮 Driving Control (Left/Bottom Panel)

- **Speed Slider (Amber)**: Drag to adjust the maximum motor speed (50-255). Recommended setting: 150 for indoor use, 255 for outdoor use.
- **Direction Joystick**: Hold direction keys to move; release to stop immediately.
- **STOP Button (Red)**: Located in the center of the directional pad, click to trigger emergency stop.

### 📷 Vision System (Middle Panel)

- **Video Stream**: Low-latency real-time transmission.
- **HUD Display**: System status and AI-recognized target objects are displayed as text at the bottom.

### 🔭 Gimbal Control (Right/Middle Panel)

- **PAN (Cyan)**: Controls left/right rotation of the camera.
- **TILT (Cyan)**: Controls up/down angle of the camera (0-180°).

### 🔧 Servo Midpoint Calibration (For First-Time Installation)

A dedicated calibration module is provided at the bottom of the gimbal control panel to ensure precise servo arm posture during installation:

1. Connect the servos but do not tighten the arm fixing screws.
2. Start the program and open the web console.
3. Click "Start Calibration" → both axes automatically return to the 90° midpoint.
4. Use the ±1/±5 degree fine-tuning buttons for precise adjustment.
5. Once satisfied, fix the arm and tighten the screws.
6. Click "Complete Calibration" to exit.

## 6. Frequently Asked Questions (FAQ)

**Q: Why is the interface messed up on mobile portrait mode?**  
A: Ensure the latest `style.css` is referenced. The new stylesheet includes `@media` queries that automatically place the video at the top and buttons at the bottom.

**Q: Why does only one side of the wheels spin?**  
A: Check the battery level. The A4950 may fail to drive two motor channels simultaneously at low voltage.

**Q: Can it be used without an internet connection?**  
A: Yes. As long as `socket.io.min.js` is downloaded to the `assets` folder, the robot can be controlled via the router's LAN without internet access.

**Q: What to do if the servos jitter?**  
A: The current code has been optimized for anti-jitter. If jitter persists, check if the servos share power with the motors. It is recommended to power the servos separately or connect a filter capacitor in parallel.

**Q: Can control be automatically restored after network disconnection?**  
A: Yes. The system has a complete weak network reconnection mechanism:

- **Mobile/PC disconnection and recovery**: Socket.IO on the browser side will automatically reconnect. The status light changes from green → flashing yellow (reconnecting) → green (recovered), with the number of reconnection attempts displayed during the process.
- **Arduino UNO Q WiFi disconnection and recovery**: The same effect applies. The UNO Q hardware layer automatically reconnects to WiFi, and the browser side rebuilds communication automatically upon detecting connection recovery.
- Default reconnection strategy: Up to 30 retry attempts, with an initial interval of 1 second, exponentially backing off to a maximum of 5 seconds. If reconnection fails after 30 attempts, a prompt "Reconnection failed, please refresh the page" is displayed.
- Parameters such as `reconnectionAttempts` (number of retries), `reconnectionDelay` (initial delay), and `reconnectionDelayMax` (maximum delay) can be modified in the `io({...})` configuration at the top of `script.js`.

## 7. Quick Start

1. Upload the code in the `sketch/` directory to the Arduino board.

2. Ensure the `assets/` directory contains `index.html`, `style.css`, and `script.js`.

3. Run the Python service:

   ```bash
   python3 python/main.py
   ```

Enjoy your desktop monitoring robot!🚀

<!--
 * @Author: WALT
 * @Date: 2026-02-05 18:26:41
-->
# 🤖 FPV AI 桌面监控机器人 (Desktop Surveillance Robot)

## 1. 项目概述 (Overview)
本项目构建了一个基于 **Arduino Uno Q** 的 FPV 桌面监控机器人。它具备实时视频回传、AI 物体识别、两轴云台控制以及全向移动调速能力。

**核心亮点**：
* **Web 全栈架构**：HTML/CSS/JS 前端分离，结构清晰。
* **赛博朋克仪表盘**：响应式 UI，电脑端三栏布局，手机竖屏自动优化排序。
* **混合驱动底层**：解决了 Arduino 定时器冲突，同时实现舵机稳像与电机平滑调速。
* **离线运行支持**：前端资源本地化，无需外网即可在局域网内流畅控制。
* **弱网自动重连**：内置断网重连机制，手机断网或机器人断 WiFi 后均可自动恢复控制，状态灯实时指示连接状态。

---

## 2. 项目目录结构 (File Structure)
项目采用前后端分离的文件组织方式，便于维护：

```text
tracked_plz/
├── sketch/
│   └── sketch.ino       # Arduino 底层固件 (C++)
├── python/
│   └── main.py          # Python 中台逻辑 (Socket.IO/Bridge/AI)
├── assets/              # 前端静态资源
│   ├── index.html       # 网页骨架 (标题: 桌面监控机器人)
│   ├── style.css        # 样式表 (含竖屏布局优化)
│   ├── script.js        # 交互逻辑 (Socket通信/防抖)
│   └── socket.io.min.js # 本地依赖库 (推荐下载放置此处)
└── README.md            # 项目文档
```

## 3. 硬件架构与接线 (Hardware & Wiring)

| 组件 | 型号 | Arduino 引脚 | 说明 |
|------|------|--------------|------|
| 主控 | Arduino Uno Q | - | 基于 STM32/Zephyr |
| 电机驱动 | A4950 (双路) | - | 需外接 7.4V-12V 锂电池 |
| 左电机 | 减速电机 | D5, D6 | 负责左侧履带 |
| 右电机 | 减速电机 | D9, D10 | 负责右侧履带 (底层已做反向修正) |
| 云台 Pan | SG90 舵机 | D3 | 水平旋转 (0-180°) |
| 云台 Tilt | SG90 舵机 | D11 | 垂直点头 (限位 60-120°，中位 90°) |
| 摄像头 | USB Cam | USB Port | 视频流端口: 49124 |

## 4. 软件架构解析 (Software Architecture)

### 4.1 前端 (Assets)
- **布局逻辑 (style.css)**: PC/平板: 左(驾驶)-中(视频)-右(云台) 三栏布局。手机竖屏: 强制重排顺序为 视频(顶) -> 云台(中) -> 驾驶(底)，符合单手操作习惯。
- **交互逻辑 (script.js)**: 安全机制: 监听 touchcancel 和 mouseleave，防止手指滑出按钮后小车失控。离线优先: 优先加载本地 socket.io.min.js，无网环境也能跑。弱网重连: Socket.IO 自动重连并在 UI 上实时展示连接状态（ONLINE/重连中/重连失败）。

### 4.2 中台 (Python)
- **速度管理**: 维护全局 current_speed 变量，接收前端滑块数值 (50-255)。
- **指令路由**: 将前端的语义指令 (up, stop) 转换为底层电机参数。
- **AI 视觉**: 后台运行物体检测，通过 Socket 实时推送识别结果（如 [TARGET] person）。

### 4.3 底层 (C++)
采用 "混合驱动模式" (Hybrid Drive) 解决资源冲突：
- **SG90 舵机**: 使用硬件 <Servo.h> 库，占用定时器，保证云台不抖动。
- **直流电机**: 使用 非阻塞软件 PWM (基于 micros())，规避了 D9/D10 硬件 PWM 失效的问题，实现平滑调速。

## 5. 操作说明 (User Guide)
浏览器访问 `http://<机器人IP>:7000` 进入控制台。

### 🎮 驾驶控制 (左侧/下方面板)
- **速度滑块 (Amber)**: 拖动调节电机最大速度 (50-255)。建议室内设为 150，户外设为 255。
- **方向摇杆**: 按住方向键移动，松手即停。
- **STOP 按钮 (红色)**: 位于十字键中央，点击可触发急停。

### 📷 视觉系统 (中间面板)
- **视频流**: 低延迟实时回传。
- **HUD 显示**: 底部文字显示系统状态及 AI 识别到的目标物体。

### 🔭 云台控制 (右侧/中间面板)
- **PAN (青色)**: 控制摄像头左右旋转。
- **TILT (青色)**: 控制摄像头上下角度 (0-180°)。

### 🔧 舵机中位校准 (首次安装时使用)
云台控制面板下方有专用校准模块，用于确保舵机安装时摇臂姿态精确：
1. 接好舵机但不拧紧摇臂固定螺丝
2. 启动程序，打开 Web 控制台
3. 点击“开始校准”→ 双轴自动回中 90°
4. 使用 ±1/±5 度微调按钮精确调整
5. 满意后固定摇臂、拧紧螺丝
6. 点击“完成校准”退出

## 6. 常见问题 (FAQ)
**Q: 为什么手机竖屏时界面乱了？**  
A: 确保引用了最新的 style.css。新样式表包含 @media 查询，会自动将视频置顶，按钮置底。

**Q: 为什么小车只有一侧轮子转？**  
A: 检查电池电量。A4950 在低电压下可能无法同时驱动两路电机。

**Q: 没有网络可以用吗？**  
A: 可以。只要下载了 socket.io.min.js 到 assets 文件夹，机器人连接路由器的局域网即可控制，无需互联网。

**Q: 舵机抖动怎么办？**  
A: 当前代码已优化防抖。如果仍有抖动，请检查是否与电机共用了电源，建议给舵机单独供电或并联滤波电容。

**Q: 网络断开后还能自动恢复控制吗？**  
A: 可以。系统内置了完整的弱网重连机制：
- **手机/电脑断网再恢复**：浏览器端 Socket.IO 会自动重连，状态灯从绿色→黄色闪烁（重连中）→绿色（恢复），期间可看到重连次数。
- **Arduino UNO Q 断 WiFi 再恢复**：效果相同。UNO Q 硬件层自动重连 WiFi，浏览器端检测到连接恢复后自动重建通信。
- 默认重连策略：最多重试 30 次，首次间隔 1 秒，指数退避至最大 5 秒。超过 30 次未成功则提示"重连失败，请刷新页面"。
- 可在 `script.js` 顶部的 `io({...})` 配置中修改 `reconnectionAttempts`（重试次数）、`reconnectionDelay`（首次延迟）、`reconnectionDelayMax`（最大延迟）等参数。

## 7. 快速启动
1. 将 sketch/ 目录下的代码上传至 Arduino。
2. 确保 assets/ 目录下有 index.html, style.css, script.js。
3. 运行 Python 服务：
   ```bash
   python3 python/main.py
   ```

享受你的桌面监控机器人！🚀

文档生成时间: 2026-02-05
