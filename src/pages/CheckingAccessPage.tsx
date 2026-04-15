import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import { styles } from '../theme/styles';

export function CheckingAccessPage() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Learning DevOps Admin</Text>
          <Text style={styles.title}>Checking access</Text>
          <Text style={styles.subtitle}>
            Verifying your session before loading the admin console.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
