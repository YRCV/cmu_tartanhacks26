import React from 'react';
import { View, Text } from 'react-native';
import { ToggleControl } from '../controls/ToggleControl';
import { SliderControl } from '../controls/SliderControl';
import { GaugeControl } from '../controls/GaugeControl';
import { TextReadout } from '../controls/TextReadout';

interface ControlSchema {
    type: 'toggle' | 'slider' | 'gauge' | 'text';
    label: string;
    value: any; // In a real app this would be more specific or handled via context/props
    // details for specific controls
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    id: string; // Add ID for keying
}

interface ControlRendererProps {
    schema: ControlSchema;
    onValueChange?: (value: any) => void;
}

export function ControlRenderer({ schema, onValueChange }: ControlRendererProps) {
    switch (schema.type) {
        case 'toggle':
            return (
                <View className="mb-4">
                    <ToggleControl
                        label={schema.label}
                        value={schema.value}
                        onValueChange={onValueChange || (() => { })}
                    />
                </View>
            );
        case 'slider':
            return (
                <View className="mb-4">
                    <SliderControl
                        label={schema.label}
                        value={schema.value}
                        min={schema.min ?? 0}
                        max={schema.max ?? 100}
                        step={schema.step ?? 1}
                        unit={schema.unit}
                        onValueChange={onValueChange || (() => { })}
                    />
                </View>
            );
        case 'gauge':
            return (
                <View className="mb-4">
                    <GaugeControl
                        label={schema.label}
                        value={schema.value}
                        min={schema.min ?? 0}
                        max={schema.max ?? 100}
                        unit={schema.unit}
                    />
                </View>
            );
        case 'text':
            return (
                <View className="mb-4">
                    <TextReadout
                        label={schema.label}
                        value={schema.value}
                        unit={schema.unit}
                    />
                </View>
            );
        default:
            return (
                <View className="p-4 bg-red-100 dark:bg-red-900 rounded-lg mb-4">
                    <Text className="text-red-900 dark:text-red-50">Unknown control type: {schema.type}</Text>
                </View>
            );
    }
}
