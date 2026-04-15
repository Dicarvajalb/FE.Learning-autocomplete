import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';
import {
  createQuestion,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  getCurrentUser,
  getQuiz,
  logout,
  searchQuizzes,
  updateQuestion,
  updateQuiz,
} from '../services/quizApi';
import type {
  QuizDetail,
  QuizQuestion,
  QuizSearchItem,
} from '../types';
import {
  emptyQuestionForm,
  emptyQuizForm,
  errorWithFallback,
  normalizeQuestionForm,
  normalizeQuizForm,
  quizToForm,
  type QuestionFormState,
  type QuizFormState,
} from '../features/quiz/quizViewModels';
import { type AppRoute, useAppRoute } from '../hooks/useAppRoute';

type AdminAccessState = 'checking' | 'authenticated' | 'unauthenticated';

type AppStoreValue = {
  route: AppRoute;
  syncRoute: (nextRoute: AppRoute, replace?: boolean) => void;
  syncPath: (targetPath: string, replace?: boolean) => void;
  adminAccessState: AdminAccessState;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  limit: number;
  searchLoading: boolean;
  searchError: string | null;
  searchResults: QuizSearchItem[];
  totalResults: number;
  selectedQuizId: string | null;
  selectedQuiz: QuizDetail | null;
  quizForm: QuizFormState;
  setQuizForm: React.Dispatch<React.SetStateAction<QuizFormState>>;
  selectedQuestionId: string | null;
  setSelectedQuestionId: React.Dispatch<React.SetStateAction<string | null>>;
  questionForm: QuestionFormState;
  setQuestionForm: React.Dispatch<React.SetStateAction<QuestionFormState>>;
  statusMessage: string;
  savingQuiz: boolean;
  savingQuestion: boolean;
  totalPages: number;
  handleLogout: () => Promise<void>;
  loadSearch: (nextPage?: number) => Promise<void>;
  loadQuiz: (quizId: string) => Promise<void>;
  saveQuiz: () => Promise<void>;
  removeQuiz: () => Promise<void>;
  saveQuestion: () => Promise<void>;
  removeQuestion: (questionId: string) => Promise<void>;
  beginNewQuiz: () => void;
  refreshSelectedQuiz: (quizId: string) => Promise<QuizDetail>;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const { route, syncRoute, syncPath } = useAppRoute();
  const [adminAccessState, setAdminAccessState] =
    useState<AdminAccessState>('checking');

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<QuizSearchItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);

  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizDetail | null>(null);
  const [quizForm, setQuizForm] = useState<QuizFormState>(emptyQuizForm());
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(
    emptyQuestionForm(),
  );
  const [statusMessage, setStatusMessage] = useState(
    'Use the search panel to load a quiz or create a new one.',
  );
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalResults / limit)),
    [totalResults],
  );

  function resetAdminState() {
    setSearchQuery('');
    setPage(1);
    setSearchLoading(false);
    setSearchError(null);
    setSearchResults([]);
    setTotalResults(0);
    setSelectedQuizId(null);
    setSelectedQuiz(null);
    setQuizForm(emptyQuizForm());
    setSelectedQuestionId(null);
    setQuestionForm(emptyQuestionForm());
    setStatusMessage('Use the search panel to load a quiz or create a new one.');
    setSavingQuiz(false);
    setSavingQuestion(false);
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // The cookie may already be gone; we still clear the local UI.
    } finally {
      resetAdminState();
      syncRoute('login', true);
    }
  }

  async function loadSearch(nextPage = page) {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const result = await searchQuizzes(searchQuery.trim(), nextPage, limit);
      setSearchResults(result.items);
      setTotalResults(result.total);
      setPage(result.page);
      setStatusMessage(
        `Loaded ${result.items.length} quizzes from page ${result.page}.`,
      );
    } catch {
      const message = errorWithFallback(
        'Unable to search quizzes',
        'The last loaded results remain on screen. Try searching again or refreshing the page.',
      );
      setSearchError(message);
      setStatusMessage(message);
    } finally {
      setSearchLoading(false);
    }
  }

  async function loadQuiz(quizId: string) {
    try {
      const quiz = await getQuiz(quizId);
      setSelectedQuizId(quiz.id);
      setSelectedQuiz(quiz);
      setQuizForm(quizToForm(quiz));
      setSelectedQuestionId(null);
      setQuestionForm(emptyQuestionForm());
      setStatusMessage(`Loaded quiz ${quiz.title}.`);
    } catch {
      const message = errorWithFallback(
        'Unable to load quiz',
        'The public quiz list is still available. Select another quiz or try again.',
      );
      setStatusMessage(message);
      Alert.alert('Load failed', message);
    }
  }

  async function refreshSelectedQuiz(quizId: string) {
    const quiz = await getQuiz(quizId);
    setSelectedQuiz(quiz);
    setQuizForm(quizToForm(quiz));
    return quiz;
  }

  async function saveQuiz() {
    const payload = normalizeQuizForm(quizForm);
    if (!payload.title || !payload.topic) {
      Alert.alert('Missing data', 'Title and topic are required.');
      return;
    }

    setSavingQuiz(true);
    try {
      const quiz = selectedQuizId
        ? await updateQuiz(selectedQuizId, payload)
        : await createQuiz(payload);
      setSelectedQuizId(quiz.id);
      setSelectedQuiz(quiz);
      setQuizForm(quizToForm(quiz));
      setStatusMessage(
        selectedQuizId ? 'Quiz updated successfully.' : 'Quiz created successfully.',
      );
      await loadSearch();
    } catch {
      const message = errorWithFallback(
        'Unable to save quiz',
        'Your form data stays in the editor, so you can retry after checking the connection or the required fields.',
      );
      setStatusMessage(message);
      Alert.alert('Save failed', message);
    } finally {
      setSavingQuiz(false);
    }
  }

  async function removeQuiz() {
    if (!selectedQuizId) {
      return;
    }

    Alert.alert('Delete quiz', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteQuiz(selectedQuizId);
            setSelectedQuizId(null);
            setSelectedQuiz(null);
            setQuizForm(emptyQuizForm());
            setSelectedQuestionId(null);
            setQuestionForm(emptyQuestionForm());
            setStatusMessage('Quiz deleted successfully.');
            await loadSearch();
          } catch {
            const message = errorWithFallback(
              'Unable to delete quiz',
              'The quiz remains unchanged in the backend. You can retry the delete action once the connection is stable.',
            );
            setStatusMessage(message);
            Alert.alert('Delete failed', message);
          }
        },
      },
    ]);
  }

  async function saveQuestion() {
    if (!selectedQuizId) {
      Alert.alert('Select a quiz', 'Load or create a quiz before editing questions.');
      return;
    }

    const payload = normalizeQuestionForm(questionForm);
    if (!payload.description || payload.options.length === 0) {
      Alert.alert('Missing data', 'Description and options are required.');
      return;
    }

    setSavingQuestion(true);
    try {
      if (selectedQuestionId) {
        await updateQuestion(selectedQuizId, selectedQuestionId, payload);
      } else {
        await createQuestion(selectedQuizId, payload);
      }

      const refreshedQuiz = await refreshSelectedQuiz(selectedQuizId);
      setSelectedQuiz(refreshedQuiz);
      setSelectedQuizId(refreshedQuiz.id);
      setQuizForm(quizToForm(refreshedQuiz));
      setSelectedQuestionId(null);
      setQuestionForm(emptyQuestionForm());
      setStatusMessage(
        selectedQuestionId
          ? 'Question updated successfully.'
          : 'Question created successfully.',
      );
      await loadSearch();
    } catch {
      const message = errorWithFallback(
        'Unable to save question',
        'Your question edits stay in the form, so nothing is lost. You can retry after fixing the connection or the option list.',
      );
      setStatusMessage(message);
      Alert.alert('Save failed', message);
    } finally {
      setSavingQuestion(false);
    }
  }

  async function removeQuestion(questionId: string) {
    if (!selectedQuizId) {
      return;
    }

    setStatusMessage('Deleting question...');
    try {
      await deleteQuestion(selectedQuizId, questionId);
      await refreshSelectedQuiz(selectedQuizId);
      setSelectedQuestionId(null);
      setQuestionForm(emptyQuestionForm());
      setStatusMessage('Question deleted successfully.');
      await loadSearch();
    } catch {
      const message = errorWithFallback(
        'Unable to delete question',
        'The question is still present in the quiz. You can retry the action after reconnecting.',
      );
      setStatusMessage(message);
      Alert.alert('Delete failed', message);
    }
  }

  function beginNewQuiz() {
    setSelectedQuizId(null);
    setSelectedQuiz(null);
    setQuizForm(emptyQuizForm());
    setSelectedQuestionId(null);
    setQuestionForm(emptyQuestionForm());
    setStatusMessage('Creating a new quiz.');
  }

  useEffect(() => {
    if (route !== 'search') {
      return;
    }

    void loadSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  useEffect(() => {
    if (route !== 'admin') {
      setAdminAccessState('unauthenticated');
      return;
    }

    let cancelled = false;
    setAdminAccessState('checking');

    void (async () => {
      try {
        const currentUser = await getCurrentUser();
        if (cancelled) {
          return;
        }

        if (currentUser.role !== 'ADMIN') {
          setAdminAccessState('unauthenticated');
          syncRoute('login', true);
          return;
        }

        setAdminAccessState('authenticated');
      } catch {
        if (cancelled) {
          return;
        }

        setAdminAccessState('unauthenticated');
        syncRoute('login', true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [route, syncRoute]);

  useEffect(() => {
    if (route !== 'admin' || adminAccessState !== 'authenticated') {
      return;
    }

    void loadSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, adminAccessState]);

  useEffect(() => {
    if (route !== 'login') {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const currentUser = await getCurrentUser();
        if (cancelled) {
          return;
        }

        if (currentUser.role === 'ADMIN') {
          syncRoute('admin', true);
        }
      } catch {
        // Stay on the login page when there is no active session.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [route, syncRoute]);

  const value = useMemo<AppStoreValue>(
    () => ({
      route,
      syncRoute,
      syncPath,
      adminAccessState,
      searchQuery,
      setSearchQuery,
      page,
      setPage,
      limit,
      searchLoading,
      searchError,
      searchResults,
      totalResults,
      selectedQuizId,
      selectedQuiz,
      quizForm,
      setQuizForm,
      selectedQuestionId,
      setSelectedQuestionId,
      questionForm,
      setQuestionForm,
      statusMessage,
      savingQuiz,
      savingQuestion,
      totalPages,
      handleLogout,
      loadSearch,
      loadQuiz,
      saveQuiz,
      removeQuiz,
      saveQuestion,
      removeQuestion,
      beginNewQuiz,
      refreshSelectedQuiz,
    }),
    [
      adminAccessState,
      beginNewQuiz,
      handleLogout,
      limit,
      loadQuiz,
      loadSearch,
      page,
      questionForm,
      refreshSelectedQuiz,
      removeQuestion,
      removeQuiz,
      route,
      savingQuestion,
      savingQuiz,
      searchError,
      searchLoading,
      searchQuery,
      searchResults,
      selectedQuestionId,
      selectedQuiz,
      selectedQuizId,
      setPage,
      setQuestionForm,
      setQuizForm,
      setSearchQuery,
      setSelectedQuestionId,
      statusMessage,
      syncRoute,
      syncPath,
      totalPages,
      totalResults,
      saveQuestion,
      saveQuiz,
    ],
  );

  return (
    <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }

  return context;
}
