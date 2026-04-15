import React from 'react';
import { type ReactNode } from 'react';
import type { QuizSearchItem } from '../../types';
import { ActionButton, Input, Section } from '../../components/ui';
import { QuizSearchResults } from './QuizSearchResults';

export function QuizSearcher({
  title,
  subtitle,
  searchQuery,
  onSearchQueryChange,
  searchLoading,
  searchError,
  searchResults,
  page,
  totalPages,
  totalResults,
  onSearch,
  onPrev,
  onNext,
  onSelectQuiz,
  searchActionLabel = 'Search',
  searchPlaceholder = 'Type a quiz title',
  actionVariant = 'secondary',
  children,
}: {
  title: string;
  subtitle: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchLoading: boolean;
  searchError: string | null;
  searchResults: QuizSearchItem[];
  page: number;
  totalPages: number;
  totalResults: number;
  onSearch: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectQuiz: (quizId: string) => void;
  searchActionLabel?: string;
  searchPlaceholder?: string;
  actionVariant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children?: ReactNode;
}) {
  return (
    <>
      <Section
        title={title}
        subtitle={subtitle}
        action={
          <ActionButton
            label={searchLoading ? 'Loading...' : searchActionLabel}
            onPress={onSearch}
            variant={actionVariant}
          />
        }
      >
        <Input
          label="Search"
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          placeholder={searchPlaceholder}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
      </Section>

      <Section title="Search results" subtitle="Tap a quiz to load its preview.">
        <QuizSearchResults
          searchLoading={searchLoading}
          searchError={searchError}
          searchResults={searchResults}
          page={page}
          totalPages={totalPages}
          totalResults={totalResults}
          onPrev={onPrev}
          onNext={onNext}
          onSelectQuiz={onSelectQuiz}
        />
      </Section>

      {children}
    </>
  );
}
