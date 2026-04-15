import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import { ActionButton } from '../components/ui';
import { openAdminLogin } from '../services/quizApi';
import { styles } from '../theme/styles';

export function LoginPage() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Learning DevOps</Text>
          <Text style={styles.title}>Admin login</Text>
          <Text style={styles.subtitle}>
            Sign in with Google to unlock the private admin console.
          </Text>
          <View style={styles.heroButtons}>
            <ActionButton label="Continue with Google" onPress={openAdminLogin} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
