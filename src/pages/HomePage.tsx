import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { createQuizSession } from '../services/quizApi';
import { useAppStore } from '../store/appStore';
import { styles } from '../theme/styles';
import { QuizSearcher } from '../features/quiz/QuizSearcher';
import { QuizPreview } from '../features/quiz/QuizPreview';

export function HomePage() {
  const {
    searchQuery,
    setSearchQuery,
    searchLoading,
    searchError,
    searchResults,
    page,
    totalPages,
    totalResults,
    selectedQuiz,
    syncPath,
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
        <Text style={styles.title}>Quiz search</Text>
        <QuizSearcher
          title="Search quizzes"
          subtitle="Search by title to load a quiz preview."
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
