const streamUrl = `http://${window.location.hostname}:4912/embed`;
document.getElementById('cam-frame').src = streamUrl;

const socket = io({
    reconnection: true,           // 启用自动重连（默认）
    reconnectionAttempts: 30,     // 最多重试30次后触发 reconnect_failed
    reconnectionDelay: 1000,      // 首次重试延迟 1秒
    reconnectionDelayMax: 5000,   // 最大重试延迟 5秒（指数退避上限）
    timeout: 10000,               // 单次连接超时 10秒
});
const dot = document.getElementById('dot');
const stat = document.getElementById('stat');
const aiText = document.getElementById('ai-text');

socket.on('connect', () => { 
    dot.classList.add('online'); 
    dot.classList.remove('reconnecting');
    stat.innerText = "ONLINE"; 
    stat.style.color = "#fff";
    aiText.innerHTML = '<span style="color:#0f0">SYSTEM READY</span>';
});
socket.on('disconnect', (reason) => { 
    dot.classList.remove('online'); 
    stat.innerText = "OFFLINE"; 
    stat.style.color = "#666";
    aiText.innerHTML = `<span style="color:#f44">DISCONNECTED</span> ${reason}`;
});

// === 弱网重连状态 ===
socket.io.on('reconnect_attempt', (attempt) => {
    dot.classList.add('reconnecting');
    stat.innerText = `重连中 #${attempt}`;
    stat.style.color = "#ffae00";
    aiText.innerHTML = `<span style="color:#ffae00">🔄 RECONNECTING...</span> 第${attempt}次尝试`;
});
socket.io.on('reconnect', (attempt) => {
    dot.classList.remove('reconnecting');
    dot.classList.add('online');
    stat.innerText = "ONLINE";
    stat.style.color = "#fff";
    aiText.innerHTML = `<span style="color:#0f0">✅ RECONNECTED</span> 经过${attempt}次重连`;
});
socket.io.on('reconnect_failed', () => {
    dot.classList.remove('reconnecting');
    stat.innerText = "重连失败";
    stat.style.color = "#f44";
    aiText.innerHTML = '<span style="color:#f44">❌ RECONNECT FAILED</span> 请刷新页面';
});

socket.on('ai_result', (data) => {
    if(data.objects && data.objects.length) {
        aiText.innerHTML = `<span style="color:#0f0">[TARGET]</span> ${data.objects.join(' • ')}`;
        aiText.style.color = "#fff";
    }
});

// === 移动控制 (增强版) ===
function move(cmd) {
    if(event && event.cancelable) event.preventDefault();
    if(navigator.vibrate) navigator.vibrate(10);
    socket.emit('move', cmd);
}

function stop() {
    if(event && event.cancelable) event.preventDefault();
    socket.emit('move', 'stop');
}

// === 速度更新 ===
function updateSpeed(val) {
    document.getElementById('speed-val').innerText = val;
    socket.emit('speed', val);
}

// === 云台更新 ===
let lastSend = 0;
function updateGimbal(axis, val, displayId) {
    document.getElementById(displayId).innerText = val + "°";
    // 同步校准显示
    const calibDisplay = document.getElementById('calib-' + axis + '-val');
    if (calibDisplay) calibDisplay.innerText = val + '°';
    const now = Date.now();
    if (now - lastSend > 30) { 
        socket.emit(axis, val);
        lastSend = now;
    }
}

// === 🔧 舵机校准模式 ===
let calibMode = false;
let calibPan = 90, calibTilt = 90;

function toggleCalibMode() {
    calibMode = !calibMode;
    const btn = document.getElementById('calibToggle');
    const controls = document.getElementById('calibControls');
    if (calibMode) {
        btn.textContent = '完成校准';
        btn.classList.add('active');
        controls.style.display = 'flex';
        // 自动回中
        calibCenter();
    } else {
        btn.textContent = '开始校准';
        btn.classList.remove('active');
        controls.style.display = 'none';
    }
}

function calibCenter() {
    calibPan = 90;
    calibTilt = 90;
    calibApply();
}

function calibNudge(axis, delta) {
    if (navigator.vibrate) navigator.vibrate(5);
    if (axis === 'pan') {
        calibPan = Math.max(0, Math.min(180, calibPan + delta));
    } else {
        calibTilt = Math.max(60, Math.min(120, calibTilt + delta));
    }
    calibApply();
}

function calibApply() {
    // 更新校准显示
    document.getElementById('calib-pan-val').innerText = calibPan + '°';
    document.getElementById('calib-tilt-val').innerText = calibTilt + '°';
    // 同步主滑块
    const panSlider = document.getElementById('slider-pan');
    const tiltSlider = document.getElementById('slider-tilt');
    if (panSlider) { panSlider.value = calibPan; document.getElementById('pan-val').innerText = calibPan + '°'; }
    if (tiltSlider) { tiltSlider.value = calibTilt; document.getElementById('tilt-val').innerText = calibTilt + '°'; }
    // 发送给舵机
    socket.emit('pan', calibPan);
    socket.emit('tilt', calibTilt);
}

// === 全局安全事件 ===
document.oncontextmenu = (e) => e.preventDefault();
document.body.addEventListener('touchcancel', stop);