#ifndef USER_APP_H
#define USER_APP_H

#include <Arduino.h>

void userAppSetup();
void userAppLoop();

// Helper to check if we are in a specific mode
extern bool isUserAppActive;

#endif
