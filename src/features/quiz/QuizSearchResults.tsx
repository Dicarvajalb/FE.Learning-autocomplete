import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { QuizSearchItem } from '../../types';
import { ActionButton } from '../../components/ui';
import { styles } from '../../theme/styles';

export function QuizSearchResults({
  searchLoading,
  searchError,
  searchResults,
  page,
  totalPages,
  totalResults,
  onPrev,
  onNext,
  onSelectQuiz,
}: {
  searchLoading: boolean;
  searchError: string | null;
  searchResults: QuizSearchItem[];
  page: number;
  totalPages: number;
  totalResults: number;
  onPrev: () => void;
  onNext: () => void;
  onSelectQuiz: (quizId: string) => void;
}) {
  return (
    <>
      <View style={styles.pager}>
        <ActionButton
          label="Prev"
          onPress={onPrev}
          variant="ghost"
        />
        <View style={styles.pagerInfo}>
          <Text style={styles.pagerTitle}>
            Page {page} of {totalPages}
          </Text>
          <Text style={styles.pagerSub}>
            {totalResults} quiz{totalResults === 1 ? '' : 'es'} total
          </Text>
        </View>
        <ActionButton
          label="Next"
          onPress={onNext}
          variant="ghost"
        />
      </View>

      {searchError ? <Text style={styles.error}>{searchError}</Text> : null}
      {searchLoading ? <Text style={styles.meta}>Loading quizzes...</Text> : null}

      <View style={styles.list}>
        {searchResults.map((quiz) => (
          <Pressable
            key={quiz.id}
            onPress={() => onSelectQuiz(quiz.id)}
            style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}
          >
            <View style={styles.listItemHeader}>
              <View style={styles.listItemCopy}>
                <Text style={styles.listItemTitle}>{quiz.title}</Text>
                <Text style={styles.listItemMeta}>
                  {quiz.topic} · {quiz.difficulty}
                </Text>
              </View>
              <Text style={styles.badge}>{quiz.questionCount} Q</Text>
            </View>
            {quiz.description ? (
              <Text style={styles.listItemDescription} numberOfLines={2}>
                {quiz.description}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    </>
  );
}
