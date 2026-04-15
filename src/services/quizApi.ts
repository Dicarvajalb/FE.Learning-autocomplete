import { Linking, Platform } from 'react-native';
import type {
  CreateQuestionInput,
  CreateQuizSessionInput,
  CreateQuizInput,
  CurrentUser,
  JoinQuizSessionInput,
  QuizDetail,
  QuizSessionAnswerSubmissionResult,
  QuizSessionDetail,
  QuizSessionResult,
  SearchQuizzesResult,
  SubmitQuizSessionAnswerInput,
} from '../types';

const API_BASE_URL = 'https://be-leaning-autocomplete.vercel.app';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function extractApiErrorMessage(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      message?: string | string[];
      error?: string;
    };

    if (Array.isArray(parsed.message)) {
      return parsed.message.filter(Boolean).join(', ');
    }

    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message.trim();
    }

    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      return parsed.error.trim();
    }
  } catch {
    // Fall through to the raw body.
  }

  return trimmed;
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    const message = extractApiErrorMessage(text);
    throw new ApiError(
      message || `Request failed with status ${response.status}`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getSocketBaseUrl() {
  return API_BASE_URL;
}

export function openAdminLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = `${API_BASE_URL}/auth/google`;
    return;
  }

  void Linking.openURL(`${API_BASE_URL}/auth/google`);
}

export function getCurrentUser() {
  return requestJson<CurrentUser>('/auth/me');
}

export function logout() {
  return requestJson<void>('/auth/logout', {
    method: 'POST',
  });
}

export function searchQuizzes(q: string, page: number, limit: number) {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
  });

  return requestJson<SearchQuizzesResult>(
    `/quizzes/search?${params.toString()}`,
  );
}

export function getQuiz(quizId: string) {
  return requestJson<QuizDetail>(`/quizzes/${quizId}`);
}

export function createQuiz(input: CreateQuizInput) {
  return requestJson<QuizDetail>('/admin/quizzes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateQuiz(quizId: string, input: CreateQuizInput) {
  return requestJson<QuizDetail>(`/admin/quizzes/${quizId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteQuiz(quizId: string) {
  return requestJson<void>(`/admin/quizzes/${quizId}`, {
    method: 'DELETE',
  });
}

export function createQuestion(quizId: string, input: CreateQuestionInput) {
  return requestJson<QuizDetail>(`/admin/quizzes/${quizId}/questions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateQuestion(
  quizId: string,
  questionId: string,
  input: CreateQuestionInput,
) {
  return requestJson<QuizDetail>(
    `/admin/quizzes/${quizId}/questions/${questionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export function deleteQuestion(quizId: string, questionId: string) {
  return requestJson<void>(`/admin/quizzes/${quizId}/questions/${questionId}`, {
    method: 'DELETE',
  });
}

export function createQuizSession(
  quizId: string,
  input: CreateQuizSessionInput,
) {
  return requestJson<QuizSessionDetail>(`/quizzes/${quizId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function joinQuizSession(joinCode: string, input: JoinQuizSessionInput) {
  return requestJson<QuizSessionDetail>(`/quiz-sessions/${joinCode}/join`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getQuizSession(sessionId: string) {
  return requestJson<QuizSessionDetail>(`/quiz-sessions/${sessionId}`);
}

export function submitQuizSessionAnswer(
  sessionId: string,
  input: SubmitQuizSessionAnswerInput,
) {
  return requestJson<QuizSessionAnswerSubmissionResult>(
    `/quiz-sessions/${sessionId}/answers`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function getQuizSessionResult(sessionId: string) {
  return requestJson<QuizSessionResult>(`/quiz-sessions/${sessionId}/result`);
}
