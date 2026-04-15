import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { ActionButton } from '../components/ui';
import { QuizPreview } from '../features/quiz/QuizPreview';
import { QuizSearcher } from '../features/quiz/QuizSearcher';
import { useAppStore } from '../store/appStore';
import { createQuizSession } from '../services/quizApi';
import { styles } from '../theme/styles';

export function SearchPage() {
  const {
    syncRoute,
    syncPath,
    searchQuery,
    setSearchQuery,
    searchLoading,
    searchError,
    searchResults,
    page,
    totalPages,
    totalResults,
    selectedQuiz,
    loadSearch,
    loadQuiz,
  } = useAppStore();

  async function launchSession(mode: 'SOLO' | 'TWO_PLAYER') {
    if (!selectedQuiz) {
      Alert.alert('Select a quiz', 'Load a quiz before starting a session.');
      return;
    }

    try {
      const session = await createQuizSession(selectedQuiz.id, { mode });
      const hostParticipant =
        session.participants.find((item) => item.seat === 'SOLO') ??
        session.participants.find((item) => item.seat === 'PLAYER_ONE') ??
        session.participants[0] ??
        null;

      syncPath(
        hostParticipant
          ? `/sessions/${session.id}?participantId=${hostParticipant.id}`
          : `/sessions/${session.id}`,
      );
    } catch {
      Alert.alert(
        'Unable to start session',
        'The quiz could not start right now. The preview stays on screen so you can try again.',
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Learning DevOps</Text>
          <Text style={styles.title}>Public quiz search</Text>
          <Text style={styles.subtitle}>
            Search quizzes by title, then open a preview.
          </Text>
          <View style={styles.heroButtons}>
            <ActionButton
              label="Home"
              onPress={() => syncRoute('home')}
              variant="ghost"
            />
            <ActionButton label="Login" onPress={() => syncRoute('login')} />
          </View>
        </View>

        <QuizSearcher
          title="Search quizzes"
          subtitle="Search by title with public access."
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchLoading={searchLoading}
          searchError={searchError}
          searchResults={searchResults}
          page={page}
          totalPages={totalPages}
          totalResults={totalResults}
          onSearch={() => void loadSearch(1)}
          onPrev={() => void loadSearch(Math.max(1, page - 1))}
          onNext={() => void loadSearch(Math.min(totalPages, page + 1))}
          onSelectQuiz={(quizId) => void loadQuiz(quizId)}
          searchActionLabel="Search"
          searchPlaceholder="Type a quiz title"
          actionVariant="secondary"
        />

        {selectedQuiz ? (
          <QuizPreview
            quiz={selectedQuiz}
            onStartSolo={() => void launchSession('SOLO')}
            onStartTwoPlayer={() => void launchSession('TWO_PLAYER')}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
