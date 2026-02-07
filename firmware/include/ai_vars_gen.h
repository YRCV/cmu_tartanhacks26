#ifndef AI_VARS_GEN_H
#define AI_VARS_GEN_H

#include <Arduino.h>

// Externs
extern int servoPin;
extern int ledPin;

inline bool updateVariableGeneric(String name, String value) {
  if (name == "servoPin") {
    servoPin = (int)value.toInt();
    return true;
  }
  if (name == "ledPin") {
    ledPin = (int)value.toInt();
    return true;
  }
  return false;
}

#endif
