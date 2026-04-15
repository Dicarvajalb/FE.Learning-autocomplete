import React from 'react';
import { Text, View } from 'react-native';
import type { QuizDetail } from '../../types';
import { ActionButton, Section } from '../../components/ui';
import { styles } from '../../theme/styles';

export function QuizPreview({
  quiz,
  onStartSolo,
  onStartTwoPlayer,
}: {
  quiz: QuizDetail;
  onStartSolo?: () => void;
  onStartTwoPlayer?: () => void;
}) {
  return (
    <Section title="Quiz preview" subtitle="Selected quiz ready to play.">
      <View style={styles.quizHeaderBox}>
        <Text style={styles.quizHeaderTitle}>{quiz.title}</Text>
        <Text style={styles.quizHeaderSub}>
          {quiz.questions.length} question{quiz.questions.length === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.heroButtons}>
        {onStartSolo ? (
          <ActionButton label="Play solo" onPress={onStartSolo} />
        ) : null}
        {onStartTwoPlayer ? (
          <ActionButton
            label="Play two-player"
            onPress={onStartTwoPlayer}
            variant="secondary"
          />
        ) : null}
      </View>
    </Section>
  );
}
