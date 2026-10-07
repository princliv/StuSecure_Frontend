/**
 * AdminWebOnlyScreen — shown to ADMIN users who open the mobile app.
 * Admin functionality lives exclusively on the web dashboard (StuSecure_Admin).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTheme } from '@/hooks/useTheme';
import { brand, type AppPalette } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import Button from '@/components/ui/Button';
import LogoutConfirmationModal from '@/components/feedback/LogoutConfirmationModal';
import { performSignOut } from '@/features/auth/signOut';

export default function AdminWebOnlyScreen() {
  const { palette, statusBarStyle } = useTheme();
  const styles = makeStyles(palette);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />

      <View style={styles.container}>
        <BrandLogo variant="with-name" height={52} style={{ marginBottom: spacing.xl }} />

        <View style={styles.card}>
          <View style={styles.cardTopStripe} />

          <View style={styles.iconWrap}>
            <MaterialIcons name="computer" size={44} color={brand.blue} />
          </View>

          <Text style={styles.title}>Admin Access — Web Only</Text>

          <Text style={styles.body}>
            The admin dashboard is available on the web. Please visit the
            StuSecure admin portal from a desktop browser to manage your
            organization.
          </Text>

          <View style={styles.urlRow}>
            <MaterialIcons name="open-in-new" size={14} color={palette.textMuted} />
            <Text style={styles.urlText}>http://localhost:5173</Text>
          </View>
        </View>

        <Button
          label="Sign Out"
          variant="outline"
          onPress={() => setLogoutModalVisible(true)}
          style={{ marginTop: spacing.xl, width: '100%' }}
        />
      </View>

      <LogoutConfirmationModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await performSignOut();
        }}
        title="Sign Out of Admin Account?"
        description="Are you sure you want to sign out? You can sign in as a student, guard, or faculty on this mobile device."
      />
    </SafeAreaView>
  );
}

function makeStyles(palette: AppPalette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },

    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxl,
      alignItems: 'center',
      justifyContent: 'center',
    },

    card: {
      width: '100%',
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg + 4,
      paddingBottom: spacing.xl,
      alignItems: 'center',
      gap: spacing.md,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 16,
      elevation: 4,
    },

    cardTopStripe: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: brand.blue,
    },

    iconWrap: {
      width: 76,
      height: 76,
      borderRadius: radius.xl,
      backgroundColor: palette.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },

    title: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.textPrimary,
      textAlign: 'center',
      fontFamily: 'Inter_700Bold',
    },

    body: {
      fontSize: 14,
      color: palette.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      fontFamily: 'Inter_400Regular',
    },

    urlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    urlText: {
      fontSize: 13,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
    },
  });
}
