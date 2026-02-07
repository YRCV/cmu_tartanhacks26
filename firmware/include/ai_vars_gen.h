#ifndef AI_VARS_GEN_H
#define AI_VARS_GEN_H

#include <Arduino.h>

// Externs
extern int kLedPin;
extern uint32_t kFastOnMs;
extern uint32_t kFastOffMs;
extern uint32_t kHoldMs;

inline bool updateVariableGeneric(String name, String value) {
  if (name == "kLedPin") {
    kLedPin = (int)value.toInt();
    return true;
  }
  if (name == "kFastOnMs") {
    kFastOnMs = (uint32_t)value.toInt();
    return true;
  }
  if (name == "kFastOffMs") {
    kFastOffMs = (uint32_t)value.toInt();
    return true;
  }
  if (name == "kHoldMs") {
    kHoldMs = (uint32_t)value.toInt();
    return true;
  }
  return false;
}

#endif
