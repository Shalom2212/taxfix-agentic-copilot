import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { THEME } from '../constants/theme';
import { ChatMessage } from '../types/tax';
import { AppIcon } from './Icon';
import { ToolExecutionBadge } from './ToolExecutionBadge';

interface CopilotChatProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  activePrompt?: string;
  onChangePrompt?: (text: string) => void;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({
  messages,
  onSendMessage,
  isLoading,
  activePrompt = '',
  onChangePrompt,
}) => {
  const [localInput, setLocalInput] = useState(activePrompt);
  const scrollViewRef = useRef<ScrollView>(null);

  const inputValue = onChangePrompt ? activePrompt : localInput;
  const setInputValue = onChangePrompt ? onChangePrompt : setLocalInput;

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    const q = inputValue.trim();
    setInputValue('');
    onSendMessage(q);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Welcome Intro Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View style={styles.botAvatar}>
              <AppIcon name="sparkles" size={16} color={THEME.colors.primary} />
            </View>
            <View>
              <Text style={styles.welcomeTitle}>Taxfix Agentic Copilot</Text>
              <Text style={styles.welcomeSub}>Autonomous German Tax Specialist</Text>
            </View>
          </View>
          <Text style={styles.welcomeBody}>
            I parse natural language to calculate your maximum statutory deductions (*Werbungskosten*) under German tax law:
          </Text>
          <View style={styles.perkList}>
            <Text style={styles.perkItem}>• 🏠 **Home Office**: €6/day up to €1,260 (210 days, *§ 4 Abs. 5 EStG*)</Text>
            <Text style={styles.perkItem}>• 📦 **Job Relocation**: €964 single / €1,928 married flat rate (*BUKG*)</Text>
            <Text style={styles.perkItem}>• 💻 **Tech Equipment**: 100% immediate digital write-off (*BMF 2022*)</Text>
          </View>
        </View>

        {/* Message Stream */}
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.messageRow,
              msg.sender === 'user' ? styles.userRow : styles.assistantRow,
            ]}
          >
            {msg.sender === 'assistant' && (
              <View style={styles.assistantAvatar}>
                <AppIcon name="sparkles" size={14} color={THEME.colors.primary} />
              </View>
            )}

            <View
              style={[
                styles.bubble,
                msg.sender === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {/* Optional Tool Calling Badge */}
              {msg.toolCall && (
                <ToolExecutionBadge
                  toolName={msg.toolCall.name}
                  parameters={msg.toolCall.parameters}
                  summary={msg.toolCall.summary}
                />
              )}

              {/* Message text formatted */}
              <Text
                style={[
                  styles.messageText,
                  msg.sender === 'user' ? styles.userMessageText : styles.assistantMessageText,
                ]}
              >
                {msg.text}
              </Text>

              <Text style={styles.timestampText}>{msg.timestamp}</Text>
            </View>
          </View>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={[styles.messageRow, styles.assistantRow]}>
            <View style={styles.assistantAvatar}>
              <AppIcon name="sparkles" size={14} color={THEME.colors.primary} />
            </View>
            <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>
                Parsing intent & calling <Text style={styles.monoCode}>calculate_german_deductions</Text>...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Moved to Berlin, bought a €1,400 MacBook, 150 WFH days..."
          placeholderTextColor={THEME.colors.textMuted}
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleSend}
          multiline={false}
          returnKeyType="send"
        />

        <TouchableOpacity
          style={[styles.sendButton, (!inputValue.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputValue.trim() || isLoading}
          activeOpacity={0.7}
        >
          <AppIcon
            name="send"
            size={15}
            color={!inputValue.trim() || isLoading ? THEME.colors.textMuted : '#000000'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    display: 'flex',
    flexDirection: 'column',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    gap: 14,
  },
  welcomeCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderLight,
    padding: 14,
    marginBottom: 6,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  welcomeSub: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  welcomeBody: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  perkList: {
    backgroundColor: THEME.colors.backgroundAlt,
    borderRadius: THEME.radius.sm,
    padding: 10,
    gap: 4,
  },
  perkItem: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: THEME.colors.userBubble,
    borderWidth: 1,
    borderColor: THEME.colors.userBubbleBorder,
    borderBottomRightRadius: THEME.radius.xs,
  },
  assistantBubble: {
    backgroundColor: THEME.colors.assistantBubble,
    borderWidth: 1,
    borderColor: THEME.colors.assistantBubbleBorder,
    borderBottomLeftRadius: THEME.radius.xs,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
  },
  userMessageText: {
    color: THEME.colors.textPrimary,
  },
  assistantMessageText: {
    color: THEME.colors.textSecondary,
  },
  timestampText: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
  },
  monoCode: {
    fontFamily: THEME.fonts.mono,
    color: THEME.colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.backgroundAlt,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: THEME.colors.textPrimary,
    fontSize: 13,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: THEME.colors.card,
  },
});
