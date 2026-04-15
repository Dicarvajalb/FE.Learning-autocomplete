import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { ActionButton, Input } from '../../components/ui';
import { styles } from '../../theme/styles';
import type { QuestionOptionFormState } from './quizViewModels';
import {
  QUESTION_OPTION_LABELS,
  createQuestionOptionDraft,
  moveQuestionOptionBefore,
  moveQuestionOptionToEnd,
} from './quizViewModels';

type Props = {
  options: QuestionOptionFormState[];
  onChange: (nextOptions: QuestionOptionFormState[]) => void;
};

type DropZoneState = {
  targetId: string | null;
};

const listStyles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  headerCopy: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  hint: {
    color: '#6d625a',
    fontSize: 12,
    lineHeight: '18px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    backgroundColor: '#fffdf9',
    border: '1px solid #e5d8cb',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  cardDragging: {
    opacity: 0.55,
  },
  cardDropTarget: {
    borderColor: '#1f1a17',
    boxShadow: '0 0 0 1px #1f1a17 inset',
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  dragHandle: {
    appearance: 'none' as const,
    border: '1px solid #dbcab9',
    backgroundColor: '#f7f1e7',
    color: '#1f1a17',
    borderRadius: 999,
    width: 36,
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab',
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1,
    flexShrink: 0,
  },
  dragHandleDragging: {
    cursor: 'grabbing',
  },
  rowBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    flex: 1,
  },
  labelRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  chipBase: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#dbcab9',
    backgroundColor: '#f7f1e7',
    borderRadius: 999,
    padding: '8px 12px',
    color: '#1f1a17',
    fontWeight: 800,
    fontSize: 12,
    cursor: 'pointer',
  },
  chipActive: {
    borderColor: '#1f1a17',
    backgroundColor: '#1f1a17',
    color: '#fffaf4',
  },
  removeRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  dropZone: {
    border: '1px dashed #dbcab9',
    borderRadius: 18,
    padding: 0,
    marginBottom: 10,
    backgroundColor: '#faf6f0',
    height: 20,
  },
  dropZoneActive: {
    borderColor: '#1f1a17',
    backgroundColor: '#f8f0e7',
  },
  endDropZone: {
    border: '1px dashed #dbcab9',
    borderRadius: 18,
    padding: 0,
    marginTop: 6,
    backgroundColor: '#faf6f0',
    height: 20,
  },
  endDropZoneActive: {
    borderColor: '#1f1a17',
    backgroundColor: '#f8f0e7',
  },
} satisfies Record<string, React.CSSProperties>;

export function QuestionOptionsEditor({ options, onChange }: Props) {
  const [draggedOptionId, setDraggedOptionId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropAtEndActive, setDropAtEndActive] = useState(false);

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

  function startDragging(optionId: string) {
    setDraggedOptionId(optionId);
    setDropTargetId(null);
    setDropAtEndActive(false);
  }

  function clearDraggingState() {
    setDraggedOptionId(null);
    setDropTargetId(null);
    setDropAtEndActive(false);
  }

  function moveBefore(targetId: string | null) {
    if (!draggedOptionId) {
      return;
    }

    if (!targetId) {
      moveToEnd();
      return;
    }

    onChange(moveQuestionOptionBefore(options, draggedOptionId, targetId));
    clearDraggingState();
  }

  function moveToEnd() {
    if (!draggedOptionId) {
      return;
    }

    onChange(moveQuestionOptionToEnd(options, draggedOptionId));
    clearDraggingState();
  }

  function renderDropZone(zone: DropZoneState, key: string) {
    const isActive = dropTargetId === zone.targetId || (dropAtEndActive && zone.targetId === null);

    return (
      <div
        key={key}
        style={{
          ...listStyles.dropZone,
          ...(isActive ? listStyles.dropZoneActive : {}),
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (draggedOptionId) {
            setDropTargetId(zone.targetId);
            setDropAtEndActive(zone.targetId === null);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          moveBefore(zone.targetId);
        }}
        onDragLeave={() => {
          if (zone.targetId === null) {
            setDropAtEndActive(false);
            return;
          }

          setDropTargetId((current) => (current === zone.targetId ? null : current));
        }}
      />
    );
  }

  return (
    <div>
      <div style={listStyles.header}>
        <div style={listStyles.headerCopy}>
          <Text style={styles.optionsTitle}>Options</Text>
          <Text style={listStyles.hint}>
            Drag the handle to reorder. Drop between options to insert the item exactly where you want.
          </Text>
        </div>
        <ActionButton label="Add option" onPress={addOption} variant="secondary" />
      </div>

      {renderDropZone(
        { targetId: options[0]?.id ?? null },
        'drop-zone-top',
      )}

      {options.map((option, index) => {
        const isDragged = draggedOptionId === option.id;

        return (
          <React.Fragment key={option.id}>
            <div
              style={{
                ...listStyles.card,
                ...(isDragged ? listStyles.cardDragging : {}),
              }}
            >
              <div style={listStyles.cardTopRow}>
                <div style={listStyles.rowBody}>
                  <Input
                    label={`Word ${index + 1}`}
                    value={option.word}
                    onChangeText={(value) => updateOption(option.id, { word: value })}
                    placeholder="Word"
                  />
                </div>
                <button
                  type="button"
                  draggable
                  aria-label={`Drag option ${index + 1}`}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', option.id);
                    startDragging(option.id);
                  }}
                  onDragEnd={clearDraggingState}
                  style={{
                    ...listStyles.dragHandle,
                    ...(isDragged ? listStyles.dragHandleDragging : {}),
                  }}
                >
                  ::
                </button>
              </div>

              <div style={listStyles.rowBody}>
                <Text style={styles.label}>Label</Text>
                <div style={listStyles.labelRow}>
                  {QUESTION_OPTION_LABELS.map((label) => (
                    <Pressable
                      key={label}
                      onPress={() => updateOption(option.id, { label })}
                      style={({ pressed }) => [
                        listStyles.chipBase,
                        option.label === label && listStyles.chipActive,
                        pressed ? { opacity: 0.82 } : null,
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
                </div>
              </div>

              <div style={listStyles.removeRow}>
                <ActionButton
                  label="Remove"
                  onPress={() => removeOption(option.id)}
                  variant="ghost"
                />
              </div>
            </div>

            {index < options.length - 1
              ? renderDropZone(
                  {
                    targetId: options[index + 1].id,
                  },
                  `drop-zone-${option.id}-${options[index + 1].id}`,
                )
              : null}
          </React.Fragment>
        );
      })}

      <div
        style={{
          ...listStyles.endDropZone,
          ...(dropAtEndActive ? listStyles.endDropZoneActive : {}),
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (draggedOptionId) {
            setDropAtEndActive(true);
            setDropTargetId(null);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          moveToEnd();
        }}
        onDragLeave={() => {
          setDropAtEndActive(false);
        }}
      >
        Drop here to move the dragged option to the end.
      </div>
    </div>
  );
}
