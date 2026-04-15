import { io, type Socket } from 'socket.io-client';
import { getSocketBaseUrl } from './quizApi';
import type {
  QuizSessionAnswerEvent,
  QuizSessionResultEvent,
  QuizSessionUpdateEvent,
} from '../types';

export type QuizSessionSocketEvents = {
  'quiz-session:connected': { connected: boolean; sessionId: string | null; participantId: string | null };
  'quiz-session:disconnected': { connected: boolean };
  'quiz-session:updated': QuizSessionUpdateEvent;
  'quiz-session:answer-submitted': QuizSessionAnswerEvent;
  'quiz-session:result': QuizSessionResultEvent;
};

export function connectQuizSessionSocket(args: {
  sessionId: string;
  participantId: string;
}) {
  return io(getSocketBaseUrl(), {
    path: '/quiz-sockets',
    transports: ['websocket'],
    withCredentials: true,
    query: {
      sessionId: args.sessionId,
      participantId: args.participantId,
    },
  }) as Socket<QuizSessionSocketEvents>;
}
