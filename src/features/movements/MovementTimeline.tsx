import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { MovementLog } from '@/services/api/movement.api';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MovementTimeline({ logs }: { logs: MovementLog[] }) {
  const { palette } = useTheme();

  if (logs.length === 0) {
    return (
      <Text style={{ color: palette.textMuted, textAlign: 'center', marginTop: spacing.lg }}>
        No movement yet.
      </Text>
    );
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      {logs.map((log, idx) => {
        const isIn = log.type === 'CHECK_IN';
        return (
          <View
            key={log.id}
            style={[
              styles.row,
              idx < logs.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: palette.border,
              },
            ]}
          >
            <View
              style={[
                styles.icon,
                { backgroundColor: isIn ? palette.secondaryFixed : palette.errorContainer },
              ]}
            >
              <MaterialIcons
                name={isIn ? 'login' : 'logout'}
                size={16}
                color={isIn ? palette.onSecondaryFixed : palette.error}
              />
            </View>
            <View style={styles.body}>
              <View style={styles.top}>
                <Text
                  style={[styles.title, { color: palette.textPrimary }]}
                  numberOfLines={1}
                >
                  {isIn ? 'Entered Campus' : 'Exited Campus'}
                  {log.student?.name ? ` · ${log.student.name}` : ''}
                </Text>
                <Text style={[styles.time, { color: palette.textMuted }]}>
                  {formatWhen(log.timestamp)}
                </Text>
              </View>
              <Text style={[styles.sub, { color: palette.textMuted }]} numberOfLines={1}>
                {log.student?.enrollmentNo ?? ''}
                {log.location ? ` · ${log.location}` : ''}
                {log.guard?.name ? ` · ${log.guard.name}` : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'flex-start',
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  time: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sub: { fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' },
});
