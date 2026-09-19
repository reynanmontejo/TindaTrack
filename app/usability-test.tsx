import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Card';
import { colors, radii, spacing } from '@/theme';

const TASKS = [
  'Add Coke with 20 pieces in stock.',
  'Record a sale of 2 Coke.',
  'Confirm that 18 Coke remain.',
  'Find today’s sales and estimated profit.',
  'Add one pack of stock.',
  'Correct a wrong physical stock count.',
  'Write “Buy Coke tomorrow” in Daily Note.',
  'Create a backup file.',
];

export default function UsabilityTestScreen() {
  const [completed, setCompleted] = useState<number[]>([]);
  const toggle = (index: number) => setCompleted((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index]);
  return (
    <AppScreen>
      <View>
        <Text style={styles.title}>Usability Test</Text>
        <Text style={styles.subtitle}>Hand the phone to a store owner. Do not teach them unless they become completely stuck.</Text>
      </View>
      <Card style={styles.instructions}>
        <MaterialCommunityIcons name="account-eye-outline" size={30} color={colors.forest} />
        <Text style={styles.instructionText}>Observe wrong taps, pauses longer than 10 seconds, unreadable labels, and requests for help. Those are design issues—not user mistakes.</Text>
      </Card>
      <View style={styles.tasks}>
        {TASKS.map((task, index) => {
          const done = completed.includes(index);
          return (
            <Pressable key={task} accessibilityRole="checkbox" accessibilityState={{ checked: done }} onPress={() => toggle(index)} style={[styles.task, done && styles.taskDone]}>
              <MaterialCommunityIcons name={done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={28} color={done ? colors.forest : colors.muted} />
              <View style={styles.grow}><Text style={[styles.taskNumber, done && styles.doneText]}>Task {index + 1}</Text><Text style={[styles.taskText, done && styles.doneText]}>{task}</Text></View>
            </Pressable>
          );
        })}
      </View>
      <Card style={styles.result}>
        <Text style={styles.resultValue}>{completed.length}/{TASKS.length}</Text>
        <Text style={styles.resultLabel}>completed without assistance</Text>
        <Text style={styles.resultHelp}>The core workflow is ready when ordinary users consistently finish Tasks 1–7 without coaching.</Text>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 29, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.xs },
  instructions: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.mint, borderColor: colors.sage },
  instructionText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 21 },
  tasks: { gap: spacing.sm },
  task: { minHeight: 72, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  taskDone: { backgroundColor: colors.mint, borderColor: colors.sage },
  grow: { flex: 1 },
  taskNumber: { color: colors.forest, fontSize: 12, fontWeight: '800' },
  taskText: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  doneText: { opacity: 0.65, textDecorationLine: 'line-through' },
  result: { alignItems: 'center', gap: spacing.xs },
  resultValue: { color: colors.forest, fontSize: 34, fontWeight: '900' },
  resultLabel: { color: colors.text, fontSize: 16, fontWeight: '800' },
  resultHelp: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
