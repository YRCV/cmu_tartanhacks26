import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { LayoutDashboard, Sparkles, Terminal, FileCode } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { theme } from '@/src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 60,
          backgroundColor: 'transparent',
          paddingTop: 8,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint="systemMaterialDark"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              borderTopWidth: 1,
              borderTopColor: theme.border.default
            }} />
          )
        ),
        tabBarActiveTintColor: theme.colors.primaryLight,
        tabBarInactiveTintColor: '#737373',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Console',
          tabBarIcon: ({ color }) => <Sparkles size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="code"
        options={{
          title: 'Code',
          tabBarIcon: ({ color }) => <FileCode size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="terminal"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color }) => <Terminal size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
