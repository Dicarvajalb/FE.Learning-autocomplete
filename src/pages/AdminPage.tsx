import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { ActionButton, Input, Section } from '../components/ui';
import { QuestionOptionsEditor } from '../features/quiz/QuestionOptionsEditor';
import { QuizSearcher } from '../features/quiz/QuizSearcher';
import {
  QUIZ_DIFFICULTIES,
  questionToForm,
} from '../features/quiz/quizViewModels';
import { useAppStore } from '../store/appStore';
import { styles } from '../theme/styles';

export function AdminPage() {
  const {
    syncRoute,
    handleLogout,
    searchLoading,
    searchError,
    searchResults,
    page,
    totalPages,
    totalResults,
    loadSearch,
    loadQuiz,
    searchQuery,
    setSearchQuery,
    selectedQuizId,
    selectedQuiz,
    quizForm,
    setQuizForm,
    saveQuiz,
    removeQuiz,
    selectedQuestionId,
    setSelectedQuestionId,
    questionForm,
    setQuestionForm,
    saveQuestion,
    removeQuestion,
    beginNewQuiz,
    savingQuiz,
    savingQuestion,
    statusMessage,
  } = useAppStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Learning DevOps Admin</Text>
          <Text style={styles.title}>Quiz management console</Text>
          <Text style={styles.subtitle}>
            Manage published quizzes and their questions through the backend CRUD
            endpoints.
          </Text>
          <View style={styles.heroButtons}>
            <ActionButton label="Logout" onPress={handleLogout} variant="ghost" />
            <ActionButton
              label="New quiz"
              onPress={beginNewQuiz}
              variant="secondary"
            />
            <ActionButton
              label={searchLoading ? 'Loading...' : 'Refresh'}
              onPress={() => void loadSearch(page)}
              variant="ghost"
            />
          </View>
        </View>

        <View style={styles.columns}>
          <View style={styles.column}>
            <QuizSearcher
              title="Search quizzes"
              subtitle="Search by title and open a quiz in the editor."
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

            <Section
              title={selectedQuizId ? 'Edit quiz' : 'Create quiz'}
              subtitle="Quiz changes are validated and audited by the backend."
              action={
                <ActionButton
                  label={savingQuiz ? 'Saving...' : selectedQuizId ? 'Save changes' : 'Create'}
                  onPress={() => void saveQuiz()}
                />
              }
            >
              <Input
                label="Title"
                value={quizForm.title}
                onChangeText={(value) =>
                  setQuizForm((current) => ({ ...current, title: value }))
                }
                placeholder="Displayed quiz title"
              />
              <Input
                label="Topic"
                value={quizForm.topic}
                onChangeText={(value) =>
                  setQuizForm((current) => ({ ...current, topic: value }))
                }
                placeholder="Quiz topic"
              />
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.optionLabelRow}>
                {QUIZ_DIFFICULTIES.map((difficulty) => (
                  <Pressable
                    key={difficulty}
                    onPress={() =>
                      setQuizForm((current) => ({ ...current, difficulty }))
                    }
                    style={({ pressed }) => [
                      styles.optionLabelChip,
                      quizForm.difficulty === difficulty &&
                        styles.optionLabelChipActive,
                      pressed && styles.listItemPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabelText,
                        quizForm.difficulty === difficulty &&
                          styles.optionLabelTextActive,
                      ]}
                    >
                      {difficulty}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Input
                label="Description"
                value={quizForm.description}
                onChangeText={(value) =>
                  setQuizForm((current) => ({ ...current, description: value }))
                }
                placeholder="Optional description"
                multiline
              />

              {selectedQuiz ? (
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Quiz ID</Text>
                  <Text style={styles.detailValue}>{selectedQuiz.id}</Text>
                  <Text style={styles.detailLabel}>Published content</Text>
                  <Text style={styles.detailValue}>
                    Once saved, the quiz is available to the public catalog.
                  </Text>
                  <ActionButton
                    label="Delete quiz"
                    onPress={() => void removeQuiz()}
                    variant="danger"
                  />
                </View>
              ) : null}
            </Section>
          </View>

          <View style={styles.column}>
            <Section
              title="Manage questions"
              subtitle="One question type is supported: autocomplete order selection."
            >
              {selectedQuiz ? (
                <>
                  <View style={styles.quizHeaderBox}>
                    <Text style={styles.quizHeaderTitle}>{selectedQuiz.title}</Text>
                    <Text style={styles.quizHeaderSub}>
                      {selectedQuiz.questions?.length ?? 0} question
                      {(selectedQuiz.questions?.length ?? 0) === 1 ? '' : 's'}
                    </Text>
                  </View>

                  <View style={styles.list}>
                    {(selectedQuiz.questions ?? []).map((question, index) => (
                      <Pressable
                        key={question.id}
                        onPress={() => {
                          setSelectedQuestionId(question.id);
                          setQuestionForm(questionToForm(question));
                        }}
                        style={({ pressed }) => [
                          styles.questionItem,
                          selectedQuestionId === question.id &&
                            styles.questionItemActive,
                          pressed && styles.listItemPressed,
                        ]}
                      >
                        <View style={styles.listItemHeader}>
                          <View style={styles.listItemCopy}>
                            <Text style={styles.listItemTitle}>
                              {index + 1}. {question.description}
                            </Text>
                            <Text style={styles.listItemMeta}>
                              {question.type} · {question.options.length} options
                            </Text>
                          </View>
                        </View>
                        <View style={styles.list}>
                          {question.options.map((option) => (
                            <View
                              key={`${question.id}-${option.word}-${option.label}`}
                              style={styles.optionChipRow}
                            >
                              <Text style={styles.optionWord}>{option.word}</Text>
                              <Text style={styles.badge}>{option.label}</Text>
                            </View>
                          ))}
                        </View>
                        <ActionButton
                          label="Delete question"
                          onPress={() => void removeQuestion(question.id)}
                          variant="danger"
                        />
                      </Pressable>
                    ))}
                  </View>

                  <Section
                    title={selectedQuestionId ? 'Edit question' : 'Create question'}
                    subtitle="Server-side validation enforces the deterministic question model."
                    action={
                      <ActionButton
                        label={savingQuestion ? 'Saving...' : 'Save question'}
                        onPress={() => void saveQuestion()}
                      />
                    }
                  >
                    <Input
                      label="Description"
                      value={questionForm.description}
                      onChangeText={(value) =>
                        setQuestionForm((current) => ({
                          ...current,
                          description: value,
                        }))
                      }
                      placeholder="Question description"
                      multiline
                    />
                    <QuestionOptionsEditor
                      options={questionForm.options}
                      onChange={(nextOptions) =>
                        setQuestionForm((current) => ({
                          ...current,
                          options: nextOptions,
                        }))
                      }
                    />
                  </Section>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>No quiz selected</Text>
                  <Text style={styles.emptyStateBody}>
                    Load an existing quiz or create a new one to manage its questions.
                  </Text>
                </View>
              )}
            </Section>

            <Section
              title="Admin notes"
              subtitle="The frontend talks directly to the protected admin endpoints."
            >
              <Text style={styles.note}>• CRUD routes are used for quizzes and questions.</Text>
              <Text style={styles.note}>• Validation is handled server-side via AJV.</Text>
              <Text style={styles.note}>• Saved quizzes appear in public search.</Text>
              <Text style={styles.note}>• Mutations are audited by the backend.</Text>
            </Section>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{statusMessage}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
