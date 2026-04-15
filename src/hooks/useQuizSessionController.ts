import { Alert } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getQuizSession,
  getQuizSessionResult,
  submitQuizSessionAnswer,
} from '../services/quizApi';
import { connectQuizSessionSocket } from '../services/sessionSocket';
import type {
  QuizSessionDetail,
  QuizSessionQuestionComparison,
  QuizSessionResult,
} from '../types';

type SessionFeedItem = {
  id: string;
  label: string;
};

type SessionResponseFeedback = {
  kind: 'positive' | 'negative';
  label: string;
};

function makeFeedId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useQuizSessionController(args: {
  sessionId: string | null;
  participantId: string | null;
}) {
  const { sessionId, participantId } = args;
  const [session, setSession] = useState<QuizSessionDetail | null>(null);
  const [result, setResult] = useState<QuizSessionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [feed, setFeed] = useState<SessionFeedItem[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [opponentAlert, setOpponentAlert] = useState<string | null>(null);
  const [responseFeedback, setResponseFeedback] =
    useState<SessionResponseFeedback | null>(null);
  const socketRef = useRef<ReturnType<typeof connectQuizSessionSocket> | null>(
    null,
  );
  const lastQuestionIdRef = useRef<string | null>(null);

  const currentQuestion = useMemo(() => {
    if (!session) {
      return null;
    }

    return session.quiz.questions[session.currentQuestion] ?? null;
  }, [session]);

  const currentParticipantId = participantId ?? session?.participants[0]?.id ?? null;
  const currentParticipant = useMemo(() => {
    if (!session || !currentParticipantId) {
      return null;
    }

    return session.participants.find(
      (item) => item.id === currentParticipantId,
    ) ?? null;
  }, [currentParticipantId, session]);

  async function refreshSession(nextSessionId: string) {
    setLoading(true);
    setSessionError(null);
    try {
      const nextSession = await getQuizSession(nextSessionId);
      setSession(nextSession);
      if (nextSession.status === 'COMPLETED') {
        const nextResult = await getQuizSessionResult(nextSessionId);
        setResult(nextResult);
      }
    } catch {
      setSessionError('Unable to load the session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setResult(null);
      setSelectedOrder([]);
      setFeed([]);
      setSocketConnected(false);
      setSessionError(null);
      setResponseFeedback(null);
      return;
    }

    void refreshSession(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !currentParticipantId) {
      return;
    }

    const socket = connectQuizSessionSocket({
      sessionId,
      participantId: currentParticipantId,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('quiz-session:join', {
        sessionId,
        participantId: currentParticipantId,
      });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('quiz-session:updated', (payload) => {
      setSession(payload.session);
      if (payload.session.status === 'COMPLETED') {
        void getQuizSessionResult(payload.session.id).then(setResult).catch(
          () => {
            setSessionError('The session completed, but results could not be loaded.');
          },
        );
      }
    });

    socket.on('quiz-session:answer-submitted', (payload) => {
      setSession(payload.session);
      const isCorrect = payload.submittedAnswer?.isCorrect ?? false;
      setResponseFeedback({
        kind: isCorrect ? 'positive' : 'negative',
        label: `${payload.submittedAnswer?.seat ?? 'Player'}: ${isCorrect ? 'Correct answer' : 'Incorrect answer'}`,
      });
      const submittedWords = payload.comparison.selectedOrder.join(' · ');
      const nextFeedLabel = `${payload.comparison.seat}: ${submittedWords || 'no response'}`;
      setFeed((current) => [
        {
          id: makeFeedId('answer'),
          label: `${payload.comparison.isFastest ? 'Fastest' : 'Answer'} ${nextFeedLabel}`,
        },
        ...current.slice(0, 5),
      ]);

      if (
        payload.comparison.firstResponderParticipantId &&
        payload.comparison.firstResponderParticipantId !== currentParticipantId
      ) {
        const message = 'Opponent answered first on this question.';
        setOpponentAlert(message);
        Alert.alert('Opponent faster', message);
      }
    });

    socket.on('quiz-session:result', (payload) => {
      setResult(payload.result);
      setSession(payload.result.session);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentParticipantId, sessionId]);

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    if (lastQuestionIdRef.current !== currentQuestion.id) {
      lastQuestionIdRef.current = currentQuestion.id;
      setSelectedOrder([]);
      setOpponentAlert(null);
      setResponseFeedback(null);
    }
  }, [currentQuestion]);

  const selectableWords = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }

    return currentQuestion.options.filter((option) => option.label === 'HIDE');
  }, [currentQuestion]);

  const extraWords = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }

    return currentQuestion.options.filter((option) => option.label === 'EXTRA');
  }, [currentQuestion]);

  const maxSelectableWords = useMemo(() => {
    if (!currentQuestion) {
      return 0;
    }

    return currentQuestion.options.filter((option) => option.label === 'HIDE').length;
  }, [currentQuestion]);

  const completeSelectedOrder = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }

    let blankIndex = 0;

    return currentQuestion.options
      .filter((option) => option.label !== 'EXTRA')
      .map((option) => {
        if (option.label === 'SHOW') {
          return option.word;
        }

        const nextWord = selectedOrder[blankIndex] ?? '';
        blankIndex += 1;
        return nextWord;
      });
  }, [currentQuestion, selectedOrder]);

  const selectedQuestionComparison: QuizSessionQuestionComparison | null = useMemo(
    () => {
      if (!result || !currentQuestion) {
        return null;
      }

      return (
        result.questions.find((item) => item.questionId === currentQuestion.id) ??
        null
      );
    },
    [currentQuestion, result],
  );

  function toggleWord(word: string) {
    setSelectedOrder((current) =>
      current.includes(word)
        ? current.filter((item) => item !== word)
        : current.length >= maxSelectableWords
          ? current
          : [...current, word],
    );
  }

  async function submitCurrentAnswer() {
    if (!session || !currentQuestion || !currentParticipantId) {
      setSessionError('A live session must be loaded before submitting an answer.');
      return;
    }

    if (maxSelectableWords > 0 && selectedOrder.length !== maxSelectableWords) {
      setSessionError('Fill all spaces before submitting the answer.');
      return;
    }

    setSubmitting(true);
    setSessionError(null);
    try {
      const submission = await submitQuizSessionAnswer(session.id, {
        participantId: currentParticipantId,
        questionId: currentQuestion.id,
        selectedOrder: completeSelectedOrder,
      });
      setSession(submission.session);
      const isCorrect = submission.submittedAnswer?.isCorrect ?? false;
      setResponseFeedback({
        kind: isCorrect ? 'positive' : 'negative',
        label: isCorrect ? 'Correct answer' : 'Incorrect answer',
      });
      setFeed((current) => [
        {
          id: makeFeedId('submit'),
          label: `You: ${completeSelectedOrder.join(' · ')}`,
        },
        ...current.slice(0, 5),
      ]);
      if (submission.session.status === 'COMPLETED') {
        const nextResult = await getQuizSessionResult(submission.session.id);
        setResult(nextResult);
      }
    } catch {
      setSessionError('Unable to submit the answer right now. The selection stays in place.');
    } finally {
      setSubmitting(false);
    }
  }

  return {
    session,
    result,
    loading,
    submitting,
    selectedOrder,
    setSelectedOrder,
    selectableWords,
    extraWords,
    maxSelectableWords,
    completeSelectedOrder,
    currentQuestion,
    currentParticipant,
    currentParticipantId,
    socketConnected,
    sessionError,
    setSessionError,
    opponentAlert,
    responseFeedback,
    feed,
    refreshSession,
    toggleWord,
    submitCurrentAnswer,
    selectedQuestionComparison,
  };
}
