import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

// Gracefully handle when native module isn't available (Expo Go, dev build without rebuild)
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = () => {};
let isModuleAvailable = false;

try {
    const speechModule = require('expo-speech-recognition');
    ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
    isModuleAvailable = ExpoSpeechRecognitionModule != null;
} catch (error) {
    console.log('Voice input not available - requires native build. Run: npx expo prebuild && npm run ios/android');
    isModuleAvailable = false;
}

interface VoiceInputButtonProps {
    onTranscript: (text: string) => void;
    disabled?: boolean;
}

export function VoiceInputButton({ onTranscript, disabled = false }: VoiceInputButtonProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPermissionGranted, setIsPermissionGranted] = useState(false);
    const [transcript, setTranscript] = useState('');

    // Check permissions on mount
    useEffect(() => {
        if (isModuleAvailable) {
            checkPermissions();
        }
    }, []);

    const checkPermissions = async () => {
        try {
            if (ExpoSpeechRecognitionModule) {
                const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
                setIsPermissionGranted(result.granted);
            }
        } catch (error) {
            console.log('Permission check error:', error);
        }
    };

    const requestPermissions = async () => {
        try {
            if (ExpoSpeechRecognitionModule) {
                const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
                setIsPermissionGranted(result.granted);
                return result.granted;
            }
            return false;
        } catch (error) {
            console.log('Permission request error:', error);
            return false;
        }
    };

    // Listen for speech recognition events (only if module is available)
    if (isModuleAvailable) {
        useSpeechRecognitionEvent('result', (event: any) => {
            const newTranscript = event.results[0]?.transcript || '';
            setTranscript(newTranscript);
        });

        useSpeechRecognitionEvent('end', () => {
            setIsRecording(false);
            if (transcript) {
                onTranscript(transcript);
                setTranscript('');
            }
        });

        useSpeechRecognitionEvent('error', (event: any) => {
            console.log('Speech recognition error:', event.error);
            setIsRecording(false);

            // Show user-friendly error message
            if (event.error === 'speech-timeout') {
                Alert.alert('No Speech Detected', 'Please try again and speak clearly into your device microphone.');
            } else if (event.error === 'audio-capture' || event.error === 'not-allowed') {
                Alert.alert('Audio Error', 'Unable to access your microphone. Please check your device settings.');
            } else {
                Alert.alert('Voice Input Error', 'Unable to process voice input. Please try typing instead.');
            }
        });
    }

    // If module isn't available, don't render the button
    if (!isModuleAvailable) {
        return null;
    }

    const startRecording = async () => {
        if (disabled) return;

        // Check/request permissions first
        let hasPermission = isPermissionGranted;
        if (!hasPermission) {
            hasPermission = await requestPermissions();
            if (!hasPermission) {
                Alert.alert(
                    'Microphone Permission Required',
                    'Please enable microphone access in your device settings to use voice input.',
                    [{ text: 'OK' }]
                );
                return;
            }
        }

        try {
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            setIsRecording(true);
            setTranscript('');

            await ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: true,
                maxAlternatives: 1,
                continuous: false,
                requiresOnDeviceRecognition: false,
                addsPunctuation: true,
                contextualStrings: [
                    'LED', 'temperature', 'humidity', 'sensor', 'actuator',
                    'pulse', 'blink', 'fade', 'ESP32', 'Arduino'
                ]
            });
        } catch (error) {
            console.error('Start recording error:', error);
            setIsRecording(false);
            Alert.alert('Error', 'Unable to start voice input. Please try again.');
        }
    };

    const stopRecording = async () => {
        try {
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            await ExpoSpeechRecognitionModule.stop();
        } catch (error) {
            console.error('Stop recording error:', error);
            setIsRecording(false);
        }
    };

    const handlePress = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled}
            className={`flex-row items-center justify-center px-4 py-3 rounded-xl border-2 ${
                isRecording
                    ? 'bg-red-50 dark:bg-red-950 border-red-500'
                    : disabled
                    ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 opacity-50'
                    : 'bg-blue-50 dark:bg-blue-950 border-blue-400 dark:border-blue-600'
            }`}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Stop voice input' : 'Start voice input'}
            accessibilityHint="Dictate your device behavior using your voice"
        >
            <Text className="text-2xl mr-2">
                {isRecording ? '⏹️' : '🎤'}
            </Text>
            <View>
                <Text
                    className={`font-semibold ${
                        isRecording
                            ? 'text-red-700 dark:text-red-300'
                            : disabled
                            ? 'text-neutral-400 dark:text-neutral-500'
                            : 'text-blue-700 dark:text-blue-300'
                    }`}
                >
                    {isRecording ? 'Listening...' : 'Use Voice Input'}
                </Text>
                {isRecording && transcript && (
                    <Text className="text-xs text-neutral-600 dark:text-neutral-400 mt-1" numberOfLines={1}>
                        {transcript}
                    </Text>
                )}
            </View>
        </Pressable>
    );
}
