import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ActionButton } from '../../components/ui';
import type { QuizSessionDetail, QuizSessionResult } from '../../types';
import { styles } from '../../theme/styles';

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: string) {
  let state = hashString(seed) || 1;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffleItems<T>(items: T[], seed: string) {
  const nextItems = [...items];
  const random = createSeededRandom(seed);

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const swapValue = nextItems[index];
    nextItems[index] = nextItems[swapIndex];
    nextItems[swapIndex] = swapValue;
  }

  return nextItems;
}

export function SessionRoom({
  session,
  result,
  loading,
  currentQuestionIndex,
  selectableWords,
  extraWords,
  maxSelectableWords,
  selectedOrder,
  onToggleWord,
  onSubmit,
  submitting,
  socketConnected,
  sessionError,
  opponentAlert,
  responseFeedback,
  feed,
}: {
  session: QuizSessionDetail | null;
  result: QuizSessionResult | null;
  loading: boolean;
  currentQuestionIndex: number;
  selectableWords: { word: string; label: string }[];
  extraWords: { word: string; label: string }[];
  maxSelectableWords: number;
  selectedOrder: string[];
  onToggleWord: (word: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  socketConnected: boolean;
  sessionError: string | null;
  opponentAlert: string | null;
  responseFeedback: { kind: 'positive' | 'negative'; label: string } | null;
  feed: { id: string; label: string }[];
}) {
  if (loading && !session && !result) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.cardTitle}>Loading session</Text>
            <Text style={styles.cardSubtitle}>
              Fetching the current quiz, participants, and question state.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!session && !result) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>No session loaded</Text>
        <Text style={styles.cardSubtitle}>
          Start a session from a quiz preview or join one with a code.
        </Text>
      </View>
    );
  }

  const activeSession = session ?? result?.session ?? null;
  const question = activeSession?.quiz.questions[currentQuestionIndex] ?? null;
  const phraseSegments = question
    ? question.options
        .filter((option) => option.label !== 'EXTRA')
        .map((option, index) =>
          option.label === 'SHOW'
            ? {
                id: `${question.id}-phrase-${index}`,
                kind: 'word' as const,
                word: option.word,
              }
            : {
                id: `${question.id}-phrase-${index}`,
                kind: 'blank' as const,
              },
        )
    : [];
  const phraseNodes = question
    ? (() => {
        const nodes: React.ReactNode[] = [];
        let blankIndex = 0;

        phraseSegments.forEach((segment) => {
          if (segment.kind === 'word') {
            nodes.push(
              <Text key={segment.id} style={styles.phraseWord}>
                {segment.word}
              </Text>,
            );
            return;
          }

          const selectedWord = selectedOrder[blankIndex] ?? null;
          blankIndex += 1;

          nodes.push(
            selectedWord ? (
              <Text key={segment.id} style={styles.phraseWord}>
                {selectedWord}
              </Text>
            ) : (
              <View key={segment.id} style={styles.phraseBlank} />
            ),
          );
        });

        return nodes;
      })()
    : [];
  const wordBank = React.useMemo(
    () =>
      shuffleItems(
        [...selectableWords, ...extraWords],
        question ? `${question.id}:word-bank` : 'empty-word-bank',
      ),
    [extraWords, question, selectableWords],
  );

  if (result) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderCopy}>
            <Text style={styles.cardTitle}>Session result</Text>
            <Text style={styles.cardSubtitle}>
              Final score and per-answer feedback for the completed session.
            </Text>
          </View>
        </View>

        <View style={styles.resultSummaryGrid}>
          {result.participants.map((item) => (
            <View key={item.participantId} style={styles.resultSummaryCard}>
              <Text style={styles.resultSummarySeat}>{item.seat}</Text>
              <Text style={styles.resultSummaryScore}>{item.totalScore}</Text>
              <Text style={styles.resultSummaryMeta}>
                {item.correctAnswers}/{item.answeredQuestions} correct
              </Text>
              <Text style={styles.resultSummaryMeta}>
                {item.fastestAnswers} fastest
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.optionsTitle}>Feedback</Text>
          <Text style={styles.cardSubtitle}>
            Review each question, the correct phrase, and every submitted answer one by one.
          </Text>

          <View style={styles.list}>
            {result.questions.map((item) => {
              const questionCopy =
                result.session.quiz.questions[item.questionIndex]?.description ??
                `Question ${item.questionIndex + 1}`;

              return (
                <View key={item.questionId} style={styles.feedbackCard}>
                  <View style={styles.feedbackCardHeader}>
                    <View style={styles.cardHeaderCopy}>
                      <Text style={styles.listItemTitle}>
                        Question {item.questionIndex + 1}
                      </Text>
                      <Text style={styles.listItemDescription}>{questionCopy}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.firstResponderParticipantId ? 'Answered' : 'No answer'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.feedbackAnswerGroup}>
                    <Text style={styles.feedbackLabel}>Correct answer</Text>
                    <Text style={styles.feedbackAnswerText}>
                      {item.canonicalOrder.join(' · ')}
                    </Text>
                  </View>

                  <View style={styles.feedbackAnswerList}>
                    {item.answers.map((answer) => (
                      <View
                        key={answer.answerId}
                        style={[
                          styles.feedbackAnswerRow,
                          answer.isCorrect
                            ? styles.feedbackAnswerRowPositive
                            : styles.feedbackAnswerRowNegative,
                        ]}
                      >
                        <View style={styles.feedbackAnswerRowHeader}>
                          <Text style={styles.feedbackAnswerSeat}>{answer.seat}</Text>
                          <Text
                            style={[
                              styles.feedbackAnswerState,
                              answer.isCorrect
                                ? styles.feedbackAnswerStatePositive
                                : styles.feedbackAnswerStateNegative,
                            ]}
                          >
                            {answer.isCorrect ? 'Correct' : 'Wrong'}
                          </Text>
                        </View>
                        <Text style={styles.feedbackAnswerText}>
                          {answer.selectedOrder.join(' · ') || 'No answer'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.cardTitle}>Live session</Text>
          <Text style={styles.cardSubtitle}>
            {socketConnected ? 'Connected' : 'Connecting...'}
          </Text>
        </View>
      </View>

      {sessionError ? <Text style={styles.error}>{sessionError}</Text> : null}
      {opponentAlert ? <Text style={styles.liveNotice}>{opponentAlert}</Text> : null}
      {responseFeedback ? (
        <Text
          style={[
            styles.responseFeedback,
            responseFeedback.kind === 'positive'
              ? styles.responseFeedbackPositive
              : styles.responseFeedbackNegative,
          ]}
        >
          {responseFeedback.label}
        </Text>
      ) : null}

      <View style={styles.questionBox}>
        <Text style={styles.questionTitle}>Question</Text>
        <Text style={styles.questionText}>
          {question
            ? `${currentQuestionIndex + 1}. ${question.description}`
            : 'No active question'}
        </Text>
      </View>

      {question ? (
        <>
          <View style={styles.phraseBox}>
            <Text style={styles.phraseTitle}>Complete the phrase</Text>
            <View style={styles.phraseRow}>
              {phraseNodes}
            </View>
          </View>

          <View style={styles.bankBox}>
            <View style={styles.bankHeader}>
              <View style={styles.cardHeaderCopy}>
                <Text style={styles.bankTitle}>Word list</Text>
                <Text style={styles.bankSubtitle}>
                  Tap the words in the correct order. Once all blanks are filled, the remaining words lock.
                </Text>
              </View>
            </View>

            <View style={styles.bankGrid}>
              {wordBank.map((option) => {
                const isSelected = selectedOrder.includes(option.word);
                const isLocked = !isSelected && selectedOrder.length >= maxSelectableWords;
                return (
                  <Pressable
                    key={`${question.id}-${option.label}-${option.word}`}
                    onPress={() => onToggleWord(option.word)}
                    disabled={isLocked}
                    style={({ pressed }) => [
                      styles.bankItem,
                      isSelected && styles.bankItemSelected,
                      isLocked && styles.bankItemLocked,
                      pressed && !isLocked && styles.listItemPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bankItemText,
                        isSelected && styles.bankItemTextSelected,
                        isLocked && styles.bankItemTextLocked,
                      ]}
                    >
                      {option.word}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.sessionActions}>
            <ActionButton
              label={submitting ? 'Submitting...' : 'Submit answer'}
              onPress={onSubmit}
            />
          </View>
        </>
      ) : null}

      <View style={styles.feedBox}>
        <Text style={styles.detailLabel}>Live Feed</Text>
        {feed.length === 0 ? (
          <Text style={styles.detailValue}>Waiting for answers...</Text>
        ) : (
          feed.map((item) => (
            <Text key={item.id} style={styles.feedItem}>
              {item.label}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}
