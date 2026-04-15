import type {
  CreateQuizInput,
  QuizDifficulty,
  QuizDetail,
  QuizQuestion,
  QuestionOptionLabel,
} from '../../types';

export type QuizFormState = {
  title: string;
  topic: string;
  difficulty: QuizDifficulty;
  description: string;
};

export type QuestionOptionFormState = {
  id: string;
  word: string;
  label: QuestionOptionLabel;
};

export type QuestionFormState = {
  description: string;
  options: QuestionOptionFormState[];
};

export const QUESTION_OPTION_LABELS: QuestionOptionLabel[] = [
  'HIDE',
  'SHOW',
  'EXTRA',
];

export const QUIZ_DIFFICULTIES: QuizDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

let optionFormIdCounter = 0;

function createOptionFormId() {
  optionFormIdCounter += 1;
  return `option-form-${optionFormIdCounter}`;
}

export const emptyQuizForm = (): QuizFormState => ({
  title: '',
  topic: '',
  difficulty: 'EASY',
  description: '',
});

export const emptyQuestionForm = (): QuestionFormState => ({
  description: '',
  options: [{ id: createOptionFormId(), word: '', label: 'HIDE' }],
});

export function quizToForm(quiz: QuizDetail): QuizFormState {
  return {
    title: quiz.title,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    description: quiz.description ?? '',
  };
}

export function questionToForm(question: QuizQuestion): QuestionFormState {
  return {
    description: question.description,
    options: question.options.map((option) => ({
      id: createOptionFormId(),
      word: option.word,
      label: option.label,
    })),
  };
}

export function normalizeQuizForm(form: QuizFormState): CreateQuizInput {
  return {
    title: form.title.trim(),
    topic: form.topic.trim(),
    difficulty: form.difficulty,
    description: form.description.trim() ? form.description.trim() : null,
  };
}

export function normalizeQuestionForm(form: QuestionFormState) {
  return {
    description: form.description.trim(),
    type: 'AUTOCOMPLETE_ORDER' as const,
    options: form.options.map((option) => ({
      word: option.word.trim(),
      label: option.label,
    })),
  };
}

export function errorWithFallback(operation: string, fallback: string): string {
  return `${operation}. ${fallback}`;
}

export function createQuestionOptionDraft() {
  return {
    id: createOptionFormId(),
    word: '',
    label: 'HIDE' as const,
  };
}

export function moveQuestionOptionBefore(
  options: QuestionOptionFormState[],
  movedOptionId: string,
  targetOptionId: string,
) {
  const fromIndex = options.findIndex((option) => option.id === movedOptionId);
  const targetIndex = options.findIndex((option) => option.id === targetOptionId);

  if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) {
    return options;
  }

  const nextOptions = [...options];
  const [movedOption] = nextOptions.splice(fromIndex, 1);
  const adjustedTargetIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;

  nextOptions.splice(adjustedTargetIndex, 0, movedOption);
  return nextOptions;
}

export function moveQuestionOptionToEnd(
  options: QuestionOptionFormState[],
  movedOptionId: string,
) {
  const fromIndex = options.findIndex((option) => option.id === movedOptionId);

  if (fromIndex < 0 || fromIndex === options.length - 1) {
    return options;
  }

  const nextOptions = [...options];
  const [movedOption] = nextOptions.splice(fromIndex, 1);
  nextOptions.push(movedOption);
  return nextOptions;
}
