import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function CalendarScreen() {
  const [entries, setEntries] = useState<{ date: string; calories: number; protein: number; miles: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { width } = Dimensions.get('window');

  const loadEntries = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const statKeys = keys.filter((key) => key.startsWith('stats-'));
      const data: typeof entries = [];

      for (const key of statKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          const date = key.replace('stats-', '');
          data.push({
            date,
            calories: parsed.calories || 0,
            protein: parsed.protein || 0,
            miles: parsed.miles || 0,
          });
        }
      }

      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(data);
    } catch (e) {
      console.error('Error loading entries:', e);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={[styles.date, { fontSize: width * 0.045 }]}>{item.date}</Text>
      <View style={styles.row}>
        <Text style={styles.metric}>🔥 {item.calories} cal</Text>
        <Text style={styles.metric}>💪 {item.protein} g</Text>
        <Text style={styles.metric}>🏃 {item.miles} mi</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.title}>Past Days</Text>
      {entries.length === 0 ? (
        <Text style={styles.noData}>No data yet. Add today’s stats!</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.date}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1e1e2f',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  noData: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#2a2a3d',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  date: {
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    fontSize: 16,
    color: '#ccc',
    fontWeight: '500',
  },
});
