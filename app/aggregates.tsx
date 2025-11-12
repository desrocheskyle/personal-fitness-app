import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Dimensions, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

interface DailyStats {
  date: string;
  calories: number;
  protein: number;
  miles: number;
}

export default function AggregatesScreen() {
  const [weeklyAvg, setWeeklyAvg] = useState({ calories: 0, protein: 0, miles: 0 });
  const [monthlyAvg, setMonthlyAvg] = useState({ calories: 0, protein: 0, miles: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const { width } = Dimensions.get('window');

  const loadStats = async () => {
    try {
      const today = new Date();

      const formatDate = (offset: number) => {
        const d = new Date(today);
        d.setDate(today.getDate() - offset);
        return d.toISOString().split('T')[0];
      };

      const getTotals = async (days: number) => {
        let calories = 0;
        let protein = 0;
        let miles = 0;
        let daysWithData = 0;
      
        for (let i = 0; i < days; i++) {
          const dateKey = `stats-${formatDate(i)}`;
          const data = await AsyncStorage.getItem(dateKey);
          if (data) {
            const parsed = JSON.parse(data);
            // Only count days where at least one metric exists
            if ((parsed.calories || 0) + (parsed.protein || 0) + (parsed.miles || 0) > 0) {
              calories += parsed.calories || 0;
              protein += parsed.protein || 0;
              miles += parsed.miles || 0;
              daysWithData++;
            }
          }
        }
      
        // Avoid division by 0
        if (daysWithData === 0) return { calories: 0, protein: 0, miles: 0 };
      
        return {
          calories: Math.round(calories / daysWithData),
          protein: Math.round(protein / daysWithData),
          miles: parseFloat((miles / daysWithData).toFixed(1)),
        };
      };

      const weekly = await getTotals(7);
      const monthly = await getTotals(30);

      setWeeklyAvg(weekly);
      setMonthlyAvg(monthly);
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        <Text style={[styles.title, { fontSize: width * 0.08 }]}>Your Averages</Text>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontSize: width * 0.055 }]}>Weekly Average (Last 7 Days)</Text>
          <Text style={styles.metric}>🔥 {weeklyAvg.calories} cal</Text>
          <Text style={styles.metric}>💪 {weeklyAvg.protein} g protein</Text>
          <Text style={styles.metric}>🏃 {weeklyAvg.miles} miles</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontSize: width * 0.055 }]}>Monthly Average (Last 30 Days)</Text>
          <Text style={styles.metric}>🔥 {monthlyAvg.calories} cal</Text>
          <Text style={styles.metric}>💪 {monthlyAvg.protein} g protein</Text>
          <Text style={styles.metric}>🏃 {monthlyAvg.miles} miles</Text>
        </View>

        <Text style={styles.note}>Pull down to refresh after adding new data.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1e1e2f',
  },
  container: {
    flex: 1,
    backgroundColor: '#1e1e2f',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontWeight: '700',
    color: '#fff',
    marginBottom: 25,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#2a2a3d',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 10,
    color: '#fff',
  },
  metric: {
    fontSize: 16,
    marginBottom: 5,
    color: '#ccc',
    fontWeight: '500',
  },
  note: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontSize: 13,
  },
});
