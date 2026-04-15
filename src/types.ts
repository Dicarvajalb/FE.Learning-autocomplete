export type QuizDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionType = 'AUTOCOMPLETE_ORDER';
export type UserRole = 'ADMIN' | 'USER';
export type QuestionOptionLabel = 'HIDE' | 'SHOW' | 'EXTRA';
export type QuizSessionMode = 'SOLO' | 'TWO_PLAYER';
export type QuizSessionStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type SessionParticipantSeat = 'SOLO' | 'PLAYER_ONE' | 'PLAYER_TWO';

export interface QuizOption {
  word: string;
  label: QuestionOptionLabel;
}

export interface QuizQuestion {
  id: string;
  description: string;
  type: QuestionType;
  options: QuizOption[];
}

export interface QuizDetail {
  id: string;
  title: string;
  topic: string;
  difficulty: QuizDifficulty;
  description: string | null;
  questions: QuizQuestion[];
}

export interface QuizSearchItem {
  id: string;
  title: string;
  topic: string;
  difficulty: QuizDifficulty;
  description: string | null;
  questionCount: number;
}

export interface SearchQuizzesResult {
  items: QuizSearchItem[];
  page: number;
  limit: number;
  total: number;
}

export interface CurrentUser {
  id: string;
  email: string | null;
  role: UserRole;
}

export interface CreateQuizInput {
  title: string;
  topic: string;
  difficulty: QuizDifficulty;
  description?: string | null;
}

export interface CreateQuestionInput {
  description: string;
  type: QuestionType;
  options: QuizOption[];
}

export interface CreateQuizSessionInput {
  mode: QuizSessionMode;
  participantUserId?: string | null;
}

export interface JoinQuizSessionInput {
  participantUserId?: string | null;
}

export interface SubmitQuizSessionAnswerInput {
  participantId: string;
  questionId: string;
  selectedOrder: string[];
}

export interface QuizSessionParticipant {
  id: string;
  userId: string | null;
  seat: SessionParticipantSeat;
  joinedAt: string;
  lastAnsweredAt: string | null;
  lastAnswerMs: number | null;
}

export interface QuizSessionDetail {
  id: string;
  quizId: string;
  mode: QuizSessionMode;
  status: QuizSessionStatus;
  joinCode: string | null;
  shareLink: string | null;
  currentQuestion: number;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  participants: QuizSessionParticipant[];
  quiz: QuizDetail;
}

export interface QuizSessionAnswerComparison {
  answerId: string;
  participantId: string;
  seat: SessionParticipantSeat;
  selectedOrder: string[];
  isCorrect: boolean;
  scoreAwarded: number;
  answeredAt: string;
  answeredMs: number;
  isFastest: boolean;
}

export interface QuizSessionQuestionComparison {
  questionId: string;
  questionIndex: number;
  canonicalOrder: string[];
  firstResponderParticipantId: string | null;
  answers: QuizSessionAnswerComparison[];
}

export interface QuizSessionAnswerSubmissionResult {
  session: QuizSessionDetail;
  comparison: QuizSessionQuestionComparison;
  submittedAnswer: QuizSessionAnswerComparison | null;
}

export interface QuizSessionParticipantResult {
  participantId: string;
  userId: string | null;
  seat: SessionParticipantSeat;
  totalScore: number;
  answeredQuestions: number;
  correctAnswers: number;
  fastestAnswers: number;
}

export interface QuizSessionResult {
  session: QuizSessionDetail;
  participants: QuizSessionParticipantResult[];
  questions: QuizSessionQuestionComparison[];
}

export interface QuizSessionUpdateEvent {
  session: QuizSessionDetail;
}

export interface QuizSessionAnswerEvent {
  session: QuizSessionDetail;
  comparison: QuizSessionQuestionComparison;
  submittedAnswer: QuizSessionAnswerComparison | null;
}

export interface QuizSessionResultEvent {
  result: QuizSessionResult;
}
