/*
 * @Author: WALT
 * @Date: 2026-02-05 17:54:02
 */
// SPDX-FileCopyrightText: Copyright (C) ARDUINO SRL (http://www.arduino.cc)
// SPDX-License-Identifier: MPL-2.0

#include <MsgPack.h>
#include <Arduino_RPClite.h> 
#include "Arduino_RouterBridge.h"
#include <Servo.h>

// === 硬件引脚 ===
const int PIN_L1 = D5;
const int PIN_L2 = D6;
const int PIN_R1 = D9;
const int PIN_R2 = D10;
const int PIN_PAN = D3; // 云台 Pan
const int PIN_TILT = D11; // 云台 Tilt

Servo servoPan;
Servo servoTilt;

// 目标速度
volatile int target_speed_l = 0;
volatile int target_speed_r = 0;

void setup() {
    Serial.begin(9600);
    
    pinMode(PIN_L1, OUTPUT);
    pinMode(PIN_L2, OUTPUT);
    pinMode(PIN_R1, OUTPUT);
    pinMode(PIN_R2, OUTPUT);

    servoPan.attach(PIN_PAN);
    servoTilt.attach(PIN_TILT);
    servoPan.write(90);
    servoTilt.write(90);

    Bridge.begin();
    Bridge.provide("motor_l", set_motor_l);
    Bridge.provide("motor_r", set_motor_r);
    Bridge.provide("servo_pan", set_servo_pan);
    Bridge.provide("servo_tilt", set_servo_tilt);
}

void loop() {
    Bridge.update(); 

    // === 非阻塞软件 PWM (核心黑科技) ===
    // 我们手动制造 PWM 波形，但不使用 delay()，也不依赖 analogWrite
    
    unsigned long now = micros(); // 获取当前微秒数
    const int period = 2000; // PWM 周期 2000us = 2ms (500Hz)
    
    // 计算当前周期内的“时间点” (0 ~ 1999)
    long cycle_time = now % period; 

    // 计算高电平持续时间
    int on_time_l = abs(target_speed_l) * period / 255;
    int on_time_r = abs(target_speed_r) * period / 255;

    // --- 左轮控制 ---
    if (target_speed_l == 0) {
        digitalWrite(PIN_L1, LOW); digitalWrite(PIN_L2, LOW);
    } else {
        // 判断方向
        int pin_pwm = (target_speed_l < 0) ? PIN_L1 : PIN_L2; // 你的逻辑：<0 前进
        int pin_low = (target_speed_l < 0) ? PIN_L2 : PIN_L1;
        
        // 关键：根据时间点决定是 HIGH 还是 LOW
        digitalWrite(pin_low, LOW); // 另一端永远拉低
        digitalWrite(pin_pwm, (cycle_time < on_time_l) ? HIGH : LOW);
    }

    // --- 右轮控制 ---
    if (target_speed_r == 0) {
        digitalWrite(PIN_R1, LOW); digitalWrite(PIN_R2, LOW);
    } else {
        // 判断方向 (注意右轮反向逻辑)
        // 你的逻辑：<0 前进 (对应右轮物理反向，所以这里引脚逻辑要反着写)
        // 原本 <0 是 R1=LOW, R2=HIGH。现在我们要对 High 的那个脚切片
        int pin_pwm = (target_speed_r < 0) ? PIN_R2 : PIN_R1; 
        int pin_low = (target_speed_r < 0) ? PIN_R1 : PIN_R2;

        digitalWrite(pin_low, LOW);
        digitalWrite(pin_pwm, (cycle_time < on_time_r) ? HIGH : LOW);
    }
}

// === Bridge 回调 (只负责更新变量) ===
void set_motor_l(int speed) { target_speed_l = constrain(speed, -255, 255); }
void set_motor_r(int speed) { target_speed_r = constrain(speed, -255, 255); }
void set_servo_pan(int angle) { servoPan.write(constrain(angle, 0, 180)); }
void set_servo_tilt(int angle) { servoTilt.write(constrain(angle, 60, 120)); }