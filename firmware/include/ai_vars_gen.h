#ifndef AI_VARS_GEN_H
#define AI_VARS_GEN_H

#include <Arduino.h>

// Externs
extern int LED_PIN;
extern uint16_t UNIT_MS;
extern char * MESSAGE;

inline bool updateVariableGeneric(String name, String value) {
  if (name == "LED_PIN") {
    LED_PIN = (int)value.toInt();
    pinMode(LED_PIN, OUTPUT);
    return true;
  }
  if (name == "UNIT_MS") {
    UNIT_MS = (uint16_t)value.toInt();
    return true;
  }
  if (name == "MESSAGE") {
    if (MESSAGE) free((void*)MESSAGE);
    MESSAGE = strdup(value.c_str());
    return true;
  }
  return false;
}

#endif
