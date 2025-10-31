import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/tabs';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2f95dc',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-number-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="aggregates"
        options={{
          title: 'Aggregates',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
