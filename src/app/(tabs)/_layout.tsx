import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

export default function TabsLayout() {
  const { profile } = useAuth();
  const role = profile?.role || 'broker';
  // Mismo criterio que AdminPanelSection.tsx en el Hub web: "broker" es el
  // único rol sin acceso a la Torre de Control.
  const isStaff = role !== 'broker';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.dark.accent,
        tabBarInactiveTintColor: Colors.dark.textSecondary,
        tabBarStyle: { backgroundColor: Colors.dark.backgroundElement, borderTopColor: Colors.dark.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="solicitudes"
        options={{
          title: 'Solicitudes',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Soporte',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        redirect={!isStaff}
        options={{
          title: 'Torre de Control',
          tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
