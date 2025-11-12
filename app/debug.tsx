import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface StoredItem {
  key: string;
  value: any;
}

export default function DebugScreen() {
  const [data, setData] = useState<StoredItem[]>([]);

  const load = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const result: StoredItem[] = [];
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      result.push({ key, value });
    }
    setData(result);
  };

  const deleteItem = async (key: string) => {
    Alert.alert("Delete Entry", `Are you sure you want to delete "${key}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(key);
          load();
        },
      },
    ]);
  };

  const duplicateAsNewDay = async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (!value) return;

      const parsed = JSON.parse(value);

      const today = new Date();
      const newDate = new Date(today);
      newDate.setDate(today.getDate() - Math.floor(Math.random() * 10)); // random older day

      const newKey = `stats-${newDate.toISOString().split('T')[0]}`;
      await AsyncStorage.setItem(newKey, JSON.stringify(parsed));

      Alert.alert("Duplicated!", `Created ${newKey}`);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = async () => {
    Alert.alert("Confirm Reset", "Delete all data?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete All",
        style: "destructive",
        onPress: async () => {
          const keys = await AsyncStorage.getAllKeys();
          for (const key of keys) await AsyncStorage.removeItem(key);
          load();
        },
      },
    ]);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AsyncStorage Debugger</Text>

      <TouchableOpacity onPress={load} style={styles.refreshButton}>
        <Text style={styles.refreshText}>🔄 Refresh</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
        <Text style={styles.clearText}>🗑️ Clear All</Text>
      </TouchableOpacity>

      {data.map((item) => (
        <View key={item.key} style={styles.item}>
          <Text style={styles.key}>{item.key}</Text>
          <Text style={styles.value}>{item.value}</Text>

          <View style={styles.row}>
            <TouchableOpacity onPress={() => duplicateAsNewDay(item.key)} style={styles.smallButton}>
              <Text style={styles.smallText}>📅 Duplicate</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteItem(item.key)} style={styles.smallButton}>
              <Text style={[styles.smallText, { color: 'red' }]}>🗑 Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  item: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  key: { fontWeight: 'bold', fontSize: 16 },
  value: { marginVertical: 6, color: '#555' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshText: { color: '#fff', fontWeight: 'bold' },
  clearButton: {
    backgroundColor: '#ff3b30',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  clearText: { color: '#fff', fontWeight: 'bold' },
  smallButton: { marginTop: 5 },
  smallText: { color: '#007AFF' },
});
