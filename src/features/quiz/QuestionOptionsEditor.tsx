import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ActionButton, Input } from '../../components/ui';
import { styles } from '../../theme/styles';
import type { QuestionOptionFormState } from './quizViewModels';
import {
  QUESTION_OPTION_LABELS,
  createQuestionOptionDraft,
  moveQuestionOptionBefore,
} from './quizViewModels';

type Props = {
  options: QuestionOptionFormState[];
  onChange: (nextOptions: QuestionOptionFormState[]) => void;
};

export function QuestionOptionsEditor({ options, onChange }: Props) {
  function updateOption(
    optionId: string,
    patch: Partial<QuestionOptionFormState>,
  ) {
    onChange(
      options.map((option) =>
        option.id === optionId ? { ...option, ...patch } : option,
      ),
    );
  }

  function addOption() {
    onChange([...options, createQuestionOptionDraft()]);
  }

  function removeOption(optionId: string) {
    onChange(options.filter((option) => option.id !== optionId));
  }

  return (
    <View>
      <View style={styles.optionsHeader}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.optionsTitle}>Options</Text>
          <Text style={styles.listItemMeta}>
            Use the move buttons to reorder on native builds. Drag and drop is available on web.
          </Text>
        </View>
        <ActionButton label="Add option" onPress={addOption} variant="secondary" />
      </View>

      {options.map((option, index) => (
        <View key={option.id} style={styles.optionRow}>
          <View style={styles.optionField}>
            <Input
              label="Word"
              value={option.word}
              onChangeText={(value) => updateOption(option.id, { word: value })}
              placeholder="Word"
            />
          </View>

          <View style={styles.optionField}>
            <Text style={styles.label}>Label</Text>
            <View style={styles.optionLabelRow}>
              {QUESTION_OPTION_LABELS.map((label) => (
                <Pressable
                  key={label}
                  onPress={() => updateOption(option.id, { label })}
                  style={({ pressed }) => [
                    styles.optionLabelChip,
                    option.label === label && styles.optionLabelChipActive,
                    pressed && styles.listItemPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabelText,
                      option.label === label && styles.optionLabelTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.optionChipRow}>
            <ActionButton
              label="Move up"
              onPress={() => {
                if (index === 0) {
                  return;
                }

                onChange(
                  moveQuestionOptionBefore(options, option.id, options[index - 1].id),
                );
              }}
              variant="ghost"
            />
            <ActionButton
              label="Move down"
              onPress={() => {
                if (index === options.length - 1) {
                  return;
                }

                onChange(
                  moveQuestionOptionBefore(options, option.id, options[index + 1].id),
                );
              }}
              variant="ghost"
            />
          </View>

          <View style={styles.optionRemove}>
            <ActionButton
              label="Remove"
              onPress={() => removeOption(option.id)}
              variant="ghost"
            />
          </View>
        </View>
      ))}
    </View>
  );
}
