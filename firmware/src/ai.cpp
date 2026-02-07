#include <Arduino.h>
#include <ESP32Servo.h>

int servoPin = 13;
int ledPin = 2;

Servo sg90;

void ai_test_setup() {
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  sg90.detach();
  sg90.setPeriodHertz(50);
  sg90.attach(servoPin, 500, 2400);
}

void ai_test_loop() {
  // Sweep 0 -> 180
  digitalWrite(ledPin, LOW);
  for (int pos = 0; pos <= 180; pos += 1) {
    sg90.write(pos);
    delay(15);
  }

  // Pause at end; LED on while stopped
  digitalWrite(ledPin, HIGH);
  delay(3000);

  // Sweep 180 -> 0
  digitalWrite(ledPin, LOW);
  for (int pos = 180; pos >= 0; pos -= 1) {
    sg90.write(pos);
    delay(15);
  }

  // Pause at end; LED on while stopped
  digitalWrite(ledPin, HIGH);
  delay(3000);
}