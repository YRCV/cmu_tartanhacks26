#include "user_app.h"

// Global flag - required by main.cpp
bool isUserAppActive = false;

void userAppSetup() {
  // Initialize your pins or libraries here
  pinMode(2, OUTPUT);
}

void userAppLoop() {
  // If the user app is not active, turn off LED and return
  if (!isUserAppActive) {
    digitalWrite(2, LOW);
    return;
  }

  // Put your main logic here
  // Blink twice rapidly: each blink is 100ms on, 100ms off
  digitalWrite(2, HIGH);
  delay(100);
  digitalWrite(2, LOW);
  delay(100);
  digitalWrite(2, HIGH);
  delay(100);
  digitalWrite(2, LOW);
  delay(100);

  // Stay on for 10 seconds
  digitalWrite(2, HIGH);
  delay(10000);
}