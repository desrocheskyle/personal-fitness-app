import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

// ------------------
// Types
// ------------------
type StatCardProps = {
  label: string;
  value: number;
  unit: string;
  inputValue: string;
  setInputValue: (val: string) => void;
  onAdd: () => void;
  onRemove: () => void;
};

// ------------------
// Debounce helper
// ------------------
function useDebouncedEffect(effect: () => void, deps: any[], delay: number) {
  useEffect(() => {
    const handler = setTimeout(effect, delay);
    return () => clearTimeout(handler);
  }, [...deps, delay]);
}

// ------------------
// Main Component
// ------------------
export default function TodayScreen() {
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [miles, setMiles] = useState(0);
  const [calorieInput, setCalorieInput] = useState('');
  const [proteinInput, setProteinInput] = useState('');
  const [milesInput, setMilesInput] = useState('');

  const todayDate = new Date();
  const { width } = Dimensions.get('window');

  const formatDaySuffix = (d: number) => {
    if (d >= 11 && d <= 13) return 'th';
    switch (d % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const today =
    todayDate.toLocaleString('default', { month: 'long' }) +
    ' ' +
    todayDate.getDate() +
    formatDaySuffix(todayDate.getDate()) +
    ', ' +
    todayDate.getFullYear();

  const TODAY_KEY = `stats-${today}`;
  const LAST_DATE_KEY = 'last-date';

  // ------------------
  // Load initial data & handle date rollover
  // ------------------
  useEffect(() => {
    const initData = async () => {
      try {
        const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);
        if (lastDate && lastDate !== today) {
          const yesterdayKey = `stats-${lastDate}`;
          const oldData = await AsyncStorage.getItem(yesterdayKey);
          if (oldData) {
            // preserve yesterday's data
            await AsyncStorage.setItem(yesterdayKey, oldData);
          }
          // reset today's data
          await AsyncStorage.removeItem(TODAY_KEY);
          setCalories(0);
          setProtein(0);
          setMiles(0);
        }

        const todayData = await AsyncStorage.getItem(TODAY_KEY);
        if (todayData) {
          const parsed = JSON.parse(todayData);
          setCalories(parsed.calories || 0);
          setProtein(parsed.protein || 0);
          setMiles(parsed.miles || 0);
        }

        await AsyncStorage.setItem(LAST_DATE_KEY, today);
      } catch (e) {
        console.error('Init data error:', e);
      }
    };
    initData();
  }, []);

  // ------------------
  // Save data with debounce (500ms)
  // ------------------
  useDebouncedEffect(() => {
    const saveData = async () => {
      try {
        const data = { calories, protein, miles };
        await AsyncStorage.setItem(TODAY_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Save error:', e);
      }
    };
    saveData();
  }, [calories, protein, miles], 500);

  // ------------------
  // Handlers
  // ------------------
  const handleChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: string, inputSetter: React.Dispatch<React.SetStateAction<string>>) => {
    const num = parseFloat(value.trim());
    if (!isNaN(num) && value !== '') {
      setter(prev => Math.max(0, prev + num));
    }
    inputSetter('');
  };

  const handleSubtract = (setter: React.Dispatch<React.SetStateAction<number>>, value: string, inputSetter: React.Dispatch<React.SetStateAction<string>>) => {
    const num = parseFloat(value.trim());
    if (!isNaN(num) && value !== '') {
      setter(prev => Math.max(0, prev - num));
    }
    inputSetter('');
  };

  const handleReset = async () => {
    Alert.alert('Reset Today’s Stats', 'Are you sure you want to clear today’s data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          setCalories(0);
          setProtein(0);
          setMiles(0);
          await AsyncStorage.removeItem(TODAY_KEY);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.date, { fontSize: width * 0.08 }]}>{today}</Text>

            <StatCard
              label="Calories"
              value={calories}
              unit="cal"
              inputValue={calorieInput}
              setInputValue={setCalorieInput}
              onAdd={() => handleChange(setCalories, calorieInput, setCalorieInput)}
              onRemove={() => handleSubtract(setCalories, calorieInput, setCalorieInput)}
            />

            <StatCard
              label="Protein"
              value={protein}
              unit="g"
              inputValue={proteinInput}
              setInputValue={setProteinInput}
              onAdd={() => handleChange(setProtein, proteinInput, setProteinInput)}
              onRemove={() => handleSubtract(setProtein, proteinInput, setProteinInput)}
            />

            <StatCard
              label="Miles"
              value={miles}
              unit="mi"
              inputValue={milesInput}
              setInputValue={setMilesInput}
              onAdd={() => handleChange(setMiles, milesInput, setMilesInput)}
              onRemove={() => handleSubtract(setMiles, milesInput, setMilesInput)}
            />

            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetText}>Reset Today</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ------------------
// Reusable StatCard component
// ------------------
const StatCard: React.FC<StatCardProps> = ({ label, value, unit, inputValue, setInputValue, onAdd, onRemove }) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.total}>
      {value} {unit}
    </Text>
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={inputValue}
        onChangeText={setInputValue}
        keyboardType="numeric"
        placeholder="Add / Remove"
        placeholderTextColor="#999"
      />
      <TouchableOpacity style={[styles.button, styles.add]} onPress={onAdd}>
        <Text style={styles.buttonText}>+ Add</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.remove]} onPress={onRemove}>
        <Text style={styles.buttonText}>− Remove</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ------------------
// Styles
// ------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1e1e2f',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  date: {
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#555',
    paddingBottom: 10,
  },
  card: {
    backgroundColor: '#2a2a3d',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  label: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 8,
    fontWeight: '600',
  },
  total: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1e1e2f',
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#fff',
    marginRight: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  add: {
    backgroundColor: '#4caf50',
  },
  remove: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  resetButton: {
    marginTop: 30,
    backgroundColor: '#ff6b6b',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  resetText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
