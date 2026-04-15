import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { ActionButton, Input } from '../components/ui';
import { joinQuizSession } from '../services/quizApi';
import { useAppStore } from '../store/appStore';
import { styles } from '../theme/styles';
import { useQuizSessionController } from '../hooks/useQuizSessionController';
import { SessionRoom } from '../features/session/SessionRoom';

function parseSessionPath() {
  if (typeof window === 'undefined') {
    return {
      sessionId: null as string | null,
      joinCode: null as string | null,
      participantId: null as string | null,
    };
  }

  const pathname = window.location.pathname.replace(/\/+$/, '') || '/sessions';
  const search = new URLSearchParams(window.location.search);
  const participantId = search.get('participantId');

  if (pathname.startsWith('/sessions/join/')) {
    return {
      sessionId: null,
      joinCode: pathname.slice('/sessions/join/'.length) || search.get('code'),
      participantId,
    };
  }

  if (pathname === '/sessions/join') {
    return {
      sessionId: null,
      joinCode: search.get('code'),
      participantId,
    };
  }

  if (pathname.startsWith('/sessions/')) {
    return {
      sessionId: pathname.slice('/sessions/'.length) || null,
      joinCode: null,
      participantId,
    };
  }

  return {
    sessionId: null,
    joinCode: null,
    participantId,
  };
}

export function SessionPage() {
  const { syncPath } = useAppStore();
  const parsed = parseSessionPath();
  const [joinCode, setJoinCode] = useState(parsed.joinCode ?? '');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    parsed.sessionId,
  );
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(
    parsed.participantId,
  );

  const controller = useQuizSessionController({
    sessionId: activeSessionId,
    participantId: activeParticipantId,
  });

  useEffect(() => {
    setActiveSessionId(parsed.sessionId);
    setActiveParticipantId(parsed.participantId);
    setJoinCode(parsed.joinCode ?? '');
  }, [parsed.joinCode, parsed.participantId, parsed.sessionId]);

  async function handleJoinSession() {
    const code = joinCode.trim();
    if (!code) {
      setJoinError('Enter a join code to continue.');
      return;
    }

    setJoining(true);
    setJoinError(null);
    try {
      const session = await joinQuizSession(code, {});
      const participant = session.participants.find(
        (item) => item.seat === 'PLAYER_TWO',
      );
      const participantId =
        participant?.id ??
        session.participants[session.participants.length - 1]?.id ??
        null;
      setActiveSessionId(session.id);
      setActiveParticipantId(participantId);
      syncPath(
        participantId
          ? `/sessions/${session.id}?participantId=${participantId}`
          : `/sessions/${session.id}`,
        true,
      );
    } catch {
      setJoinError('Unable to join the session. Check the code and try again.');
    } finally {
      setJoining(false);
    }
  }

  const landingMode = !activeSessionId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Learning DevOps</Text>
          <Text style={styles.title}>Quiz sessions</Text>
          <Text style={styles.subtitle}>
            Join a live match by code, or open a session that was created from a quiz preview.
          </Text>
          <View style={styles.heroButtons}>
            <ActionButton
              label="Back to search"
              onPress={() => syncPath('/quizzes')}
              variant="ghost"
            />
          </View>
        </View>

        {landingMode ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderCopy}>
                <Text style={styles.cardTitle}>Join session</Text>
                <Text style={styles.cardSubtitle}>
                  Enter a code shared by the host to join the realtime room.
                </Text>
              </View>
            </View>

            {joinError ? <Text style={styles.error}>{joinError}</Text> : null}

            <Input
              label="Join code"
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="AB12CD34"
              returnKeyType="go"
              onSubmitEditing={handleJoinSession}
            />
            <ActionButton
              label={joining ? 'Joining...' : 'Join session'}
              onPress={handleJoinSession}
            />
          </View>
        ) : (
          <SessionRoom
            session={controller.session}
            result={controller.result}
            loading={controller.loading}
            currentQuestionIndex={controller.session?.currentQuestion ?? 0}
            selectableWords={controller.selectableWords}
            extraWords={controller.extraWords}
            maxSelectableWords={controller.maxSelectableWords}
            selectedOrder={controller.selectedOrder}
            onToggleWord={controller.toggleWord}
            onSubmit={controller.submitCurrentAnswer}
            submitting={controller.submitting}
            socketConnected={controller.socketConnected}
            sessionError={controller.sessionError}
            opponentAlert={controller.opponentAlert}
            responseFeedback={controller.responseFeedback}
            feed={controller.feed}
          />
        )}

        {!landingMode && controller.session?.joinCode ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderCopy}>
                <Text style={styles.cardTitle}>Share this code</Text>
                <Text style={styles.cardSubtitle}>
                  Send the code to another player so they can join the same live session.
                </Text>
              </View>
            </View>
            <Text style={styles.detailValue}>{controller.session.joinCode}</Text>
            {controller.session.shareLink ? (
              <Text style={styles.detailValue}>{controller.session.shareLink}</Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
