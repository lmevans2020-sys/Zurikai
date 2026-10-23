import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sendChat } from '@/lib/coach';
import { checkInStreak, startOfWeek, summarizeWeek } from '@/lib/journal-math';
import { useJournal } from '@/lib/journal-store';
import type { ChatMessage } from '@/lib/types';

const STARTERS = [
  'I keep skipping my habits. Any advice?',
  'Help me build a better evening routine',
  "I'm having a rough day",
  'What should I focus on this week?',
];

export default function CoachChatScreen() {
  const theme = useTheme();
  const { chat, profile, entries, habits, today, addChatMessage, clearChat } = useJournal();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [chat.length, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setDraft('');
    setSending(true);

    const userMessage: ChatMessage = { id: 'pending', role: 'user', text: trimmed, createdAt: new Date().toISOString() };
    addChatMessage({ role: 'user', text: trimmed });
    const reply = await sendChat([...chat, userMessage], {
      profile,
      week: summarizeWeek(entries, habits, startOfWeek(today)),
      streak: checkInStreak(entries, today),
    });
    addChatMessage({ role: 'assistant', text: reply.text, failed: reply.failed });
    setSending(false);
  }

  function confirmClear() {
    Alert.alert('Start a new chat?', 'This clears the conversation on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearChat },
    ]);
  }

  const firstName = profile?.name.split(' ')[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.header, { borderColor: theme.border }]}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()}>
            <ThemedText color="accent" style={{ fontWeight: '600' }}>‹ Back</ThemedText>
          </Pressable>
          <ThemedText type="heading">Your coach</ThemedText>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={confirmClear} disabled={chat.length === 0}>
            <ThemedText color={chat.length ? 'accent' : 'textSecondary'} style={{ fontWeight: '600' }}>New</ThemedText>
          </Pressable>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
          <Bubble
            role="assistant"
            text={`Hi${firstName ? ` ${firstName}` : ''}! I'm your SteadyThrive coach. Ask me anything about building habits, staying on track or how you're feeling. What's on your mind?`}
          />

          {chat.length === 0 && (
            <View style={styles.starters}>
              {STARTERS.map((starter) => (
                <Pressable
                  key={starter}
                  accessibilityRole="button"
                  onPress={() => send(starter)}
                  style={[styles.starter, { borderColor: theme.accent, backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="small" color="accent">{starter}</ThemedText>
                </Pressable>
              ))}
            </View>
          )}

          {chat.map((message) => (
            <Bubble key={message.id} role={message.role} text={message.text} failed={message.failed} />
          ))}

          {sending && (
            <View style={[styles.bubble, styles.coach, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ActivityIndicator color={theme.accent} />
            </View>
          )}
        </ScrollView>

        <ThemedText type="small" color="textSecondary" style={styles.disclaimer}>
          Your coach is an AI. It offers encouragement, not medical advice.
        </ThemedText>

        <View style={[styles.inputBar, { borderColor: theme.border, backgroundColor: theme.background }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message your coach"
            placeholderTextColor={theme.textSecondary}
            multiline
            maxLength={1000}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={() => send(draft)}
            disabled={!draft.trim() || sending}
            style={[styles.send, { backgroundColor: theme.accent, opacity: !draft.trim() || sending ? 0.4 : 1 }]}>
            <ThemedText style={{ color: theme.accentText, fontWeight: '700', fontSize: 18 }}>↑</ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ role, text, failed }: { role: ChatMessage['role']; text: string; failed?: boolean }) {
  const theme = useTheme();
  const isUser = role === 'user';
  return (
    <View
      style={[
        styles.bubble,
        isUser
          ? [styles.user, { backgroundColor: theme.accent, borderColor: theme.accent }]
          : [styles.coach, { backgroundColor: theme.backgroundElement, borderColor: failed ? theme.warm : theme.border }],
      ]}>
      <ThemedText style={isUser ? { color: theme.accentText } : undefined} color={failed ? 'textSecondary' : 'text'}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  messages: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  user: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  coach: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  starters: { gap: Spacing.two, alignItems: 'flex-start', marginTop: Spacing.one },
  starter: { borderWidth: 1, borderRadius: Radius.large, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  disclaimer: { textAlign: 'center', paddingHorizontal: Spacing.three, fontSize: 12 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    padding: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 16,
  },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
