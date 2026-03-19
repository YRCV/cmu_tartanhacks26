import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, Platform, Alert, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import { X, Mic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// Reuse logic from VoiceInputButton regarding module availability
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = () => { };
let isModuleAvailable = false;

try {
    const speechModule = require('expo-speech-recognition');
    ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
    isModuleAvailable = ExpoSpeechRecognitionModule != null;
} catch (error) {
    isModuleAvailable = false;
}

interface FullScreenVoiceOverlayProps {
    isVisible: boolean;
    onClose: () => void;
    onTranscript: (text: string) => void;
}

const { width } = Dimensions.get('window');
const PULSE_SIZE = width * 0.6;

export function FullScreenVoiceOverlay({ isVisible, onClose, onTranscript }: FullScreenVoiceOverlayProps) {
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Animation values
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.3);

    const startAnimation = () => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            ),
            -1,
            true
        );
    };

    const stopAnimation = () => {
        cancelAnimation(scale);
        cancelAnimation(opacity);
        scale.value = withTiming(1);
        opacity.value = withTiming(0.3);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    // Speech Recognition Logic
    useEffect(() => {
        if (isVisible) {
            setTranscript('');
            startRecording();
            startAnimation();
        } else {
            stopRecording();
            stopAnimation();
        }
    }, [isVisible]);

    // Event listeners
    if (isModuleAvailable) {
        useSpeechRecognitionEvent('result', (event: any) => {
            const newTranscript = event.results[0]?.transcript || '';
            setTranscript(newTranscript);
        });

        useSpeechRecognitionEvent('end', () => {
            // Do not close automatically, user might pause. 
            // Only stop recording state logic if needed.
            // But for full screen, we usually want to keep listening until user taps done?
            // Or if it ends, we just show the result.
            // For now, let's keep it simple: if it ends, we stop recording but keep overlay open with result.
            setIsRecording(false);
            stopAnimation();
        });

        useSpeechRecognitionEvent('error', (event: any) => {
            // Handle silently or show brief text
            setIsRecording(false);
            stopAnimation();
        });
    }

    const startRecording = async () => {
        if (!isModuleAvailable) {
            // Mock mode if module missing
            setIsRecording(true);
            // Simulate transcript for demo
            let mockText = "I want the ";
            setTranscript(mockText);

            setTimeout(() => {
                if (!isVisible) return;
                mockText += "LED to turn blue ";
                setTranscript(mockText);
            }, 1000);

            setTimeout(() => {
                if (!isVisible) return;
                mockText += "when it's cold.";
                setTranscript(mockText);
            }, 2000);
            return;
        }

        try {
            const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!result.granted) {
                Alert.alert('Permission needed', 'Please enable microphone access');
                onClose();
                return;
            }

            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            setIsRecording(true);
            await ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: true,
                maxAlternatives: 1,
                continuous: false,
                requiresOnDeviceRecognition: false,
                addsPunctuation: true,
            });

        } catch (e) {
            console.error(e);
            setIsRecording(false);
        }
    };

    const stopRecording = async () => {
        if (isModuleAvailable && isRecording) {
            try {
                await ExpoSpeechRecognitionModule.stop();
            } catch (e) { }
        }
        setIsRecording(false);
    };

    const handleValidClose = () => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onTranscript(transcript);
        onClose();
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={90} tint="dark" className="flex-1 justify-center items-center p-6">

                {/* Close Button */}
                <Pressable onPress={onClose} className="absolute top-12 right-6 p-2 bg-white/10 rounded-full z-10">
                    <X size={24} color="white" />
                </Pressable>

                {/* Animated Pulsing Orb */}
                <View className="items-center justify-center mb-12">
                    <Animated.View
                        style={[
                            {
                                width: PULSE_SIZE,
                                height: PULSE_SIZE,
                                borderRadius: PULSE_SIZE / 2,
                                backgroundColor: '#4F46E5', // Indigo-600
                                position: 'absolute',
                            },
                            animatedStyle
                        ]}
                    />
                    <View className="w-32 h-32 bg-indigo-500 rounded-full items-center justify-center shadow-2xl shadow-indigo-500/50">
                        <Mic size={48} color="white" />
                    </View>
                </View>

                {/* Transcript / Status */}
                <View className="h-32 justify-center items-center w-full">
                    <Text className="text-neutral-400 font-medium mb-4 uppercase tracking-widest text-sm">
                        {isRecording ? 'Listening...' : 'Processed'}
                    </Text>
                    <Text className="text-white text-3xl font-light text-center leading-tight">
                        {transcript || (isRecording ? "..." : "Tap mic to speak")}
                    </Text>
                </View>

                {/* Actions */}
                <View className="absolute bottom-20 w-full flex-row justify-center space-x-6">
                    {/* If recording, show Stop. If done, show Confirm. */}
                    {isRecording ? (
                        <Pressable
                            onPress={() => {
                                stopRecording();
                                setIsRecording(false);
                                stopAnimation();
                            }}
                            className="bg-red-500/80 px-8 py-4 rounded-full"
                        >
                            <Text className="text-white font-bold text-lg">Stop Listening</Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={handleValidClose}
                            className="bg-white px-8 py-4 rounded-full"
                        >
                            <Text className="text-black font-bold text-lg">Use This</Text>
                        </Pressable>
                    )}
                </View>

            </BlurView>
        </Modal>
    );
}
