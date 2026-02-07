import React, { useState } from 'react';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { IntentInput } from '@/src/components/ui/IntentInput';
import { PrimaryActionButton } from '@/src/components/ui/PrimaryActionButton';
// Voice input temporarily commented out - requires native build
// Uncomment after running: npx expo prebuild && npm run ios/android
// import { VoiceInputButton } from '@/src/components/ui/VoiceInputButton';

const MAX_CHARS = 500;

const EXAMPLE_PROMPTS = [
    "Make the LED pulse faster when temperature rises above 25°C",
    "Turn on the fan when humidity exceeds 60%",
    "Flash red light when motion is detected at night"
];

export default function IntentPage() {
    const router = useRouter();
    const [intent, setIntent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [loadingText, setLoadingText] = useState('Processing...');

    const handleDeploy = () => {
        if (intent.trim().length < 10) {
            setError('Please provide a more detailed description (at least 10 characters)');
            return;
        }

        setError(null);
        setIsLoading(true);
        setLoadingText('Understanding your intent...');

        setTimeout(() => {
            setLoadingText('Generating firmware configuration...');
        }, 800);

        setTimeout(() => {
            setIsLoading(false);
            router.push('/review');
        }, 1600);
    };

    const handleExamplePress = (example: string) => {
        setIntent(example);
        setError(null);
    };

    const charCount = intent.length;
    const isOverLimit = charCount > MAX_CHARS;
    const isValid = intent.trim().length >= 10 && !isOverLimit;

    return (
        <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-6"
                    contentContainerClassName="justify-center min-h-full py-8"
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="space-y-6">
                        <View>
                            <Text className="text-4xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                                What should your device do?
                            </Text>
                            <Text className="text-neutral-500 dark:text-neutral-400 text-base">
                                Describe the behavior you want in plain English. Our AI will translate it into working firmware.
                            </Text>
                        </View>

                        <View>
                            <IntentInput
                                value={intent}
                                onChangeText={(text) => {
                                    setIntent(text);
                                    setError(null);
                                }}
                                placeholder="Describe the behavior you want..."
                                maxLength={MAX_CHARS}
                                error={error}
                            />

                            <View className="flex-row justify-between items-center mt-2 px-1">
                                <Text className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-neutral-400 dark:text-neutral-500'}`}>
                                    {charCount}/{MAX_CHARS} characters
                                </Text>
                                {isValid && (
                                    <Text className="text-xs text-green-600 dark:text-green-400">
                                        ✓ Looks good
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Voice input button temporarily disabled - requires native build
                        <VoiceInputButton
                            onTranscript={(text) => {
                                // Append to existing text or replace if empty
                                const newText = intent.trim() ? `${intent} ${text}` : text;
                                const truncated = newText.slice(0, MAX_CHARS);
                                setIntent(truncated);
                                setError(null);
                            }}
                            disabled={isLoading}
                        />
                        */}

                        {intent.length === 0 && (
                            <View className="space-y-3">
                                <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                    Try an example:
                                </Text>
                                {EXAMPLE_PROMPTS.map((example, idx) => (
                                    <Pressable
                                        key={idx}
                                        onPress={() => handleExamplePress(example)}
                                        className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700"
                                    >
                                        <Text className="text-neutral-700 dark:text-neutral-300">
                                            {example}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}

                        <PrimaryActionButton
                            title={isLoading ? loadingText : "Generate & Review"}
                            onPress={handleDeploy}
                            isLoading={isLoading}
                            disabled={!isValid || isLoading}
                        />

                        <Text className="text-xs text-neutral-400 dark:text-neutral-500 text-center px-4">
                            💡 Be specific about sensors, actuators, and conditions for best results
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
