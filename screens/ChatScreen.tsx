import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

const CHAT_RESPONSES: { [key: string]: string } = {
  hi: "Hello! Welcome to LootDrop AR. How can I help you today?",
  hello: "Hey there! I'm here to answer your questions about LootDrop AR.",
  help: "I can help you with:\n• Finding loot boxes nearby\n• Understanding how coupons work\n• Premium subscription benefits\n• How to collect and redeem deals\n\nWhat would you like to know?",
  "loot box": "Loot boxes are AR treasure chests placed at real businesses! When you're near one, open your Discover tab, point your camera, and tap the glowing box to collect exclusive deals and coupons.",
  coupon: "Coupons are special deals from local merchants. Collect them by opening loot boxes, then view all your coupons in the Collection tab. Show your code at the business to redeem!",
  premium: "Premium unlocks unlimited loot drop discoveries, exclusive deals, early access to new merchants, priority support, no ads, and advanced AR features. Check the Premium tab to subscribe!",
  map: "The Map tab shows all loot boxes in your area. Filter by category (restaurants, retail, services, entertainment) and see countdown timers for when boxes become available.",
  redeem: "To redeem a coupon: Go to Collection tab → Select your coupon → Show the code to the merchant. They'll apply your discount!",
  "how to": "To use LootDrop AR:\n1. Open the Discover tab\n2. Point your camera at nearby businesses\n3. Tap glowing loot boxes to collect deals\n4. View your coupons in Collection\n5. Redeem at the business!",
  location: "LootDrop AR uses your location to find nearby loot boxes. Make sure location services are enabled in your device settings!",
  ar: "Our AR (Augmented Reality) camera overlays loot boxes onto your real-world view. When you're near a participating business, you'll see a glowing box through your camera!",
};

function getChatbotResponse(userMessage: string): string {
  const message = userMessage.toLowerCase().trim();
  
  for (const [keyword, response] of Object.entries(CHAT_RESPONSES)) {
    if (message.includes(keyword)) {
      return response;
    }
  }
  
  if (message.includes("subscription") || message.includes("subscribe")) {
    return CHAT_RESPONSES.premium;
  }
  
  if (message.includes("find") || message.includes("discover")) {
    return CHAT_RESPONSES["loot box"];
  }
  
  if (message.includes("collect") || message.includes("claim")) {
    return CHAT_RESPONSES["how to"];
  }
  
  return "I'm here to help with LootDrop AR! Ask me about:\n• How to find and collect loot boxes\n• Coupons and deals\n• Premium features\n• Using the AR camera\n• Redeeming your rewards";
}

export default function ChatScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hi! I'm your LootDrop AR assistant. Ask me anything about finding deals, using the app, or premium features!",
      isUser: false,
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getChatbotResponse(userMessage.text),
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botResponse]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 800);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageRow,
        item.isUser ? styles.userMessageRow : styles.botMessageRow,
      ]}
    >
      {!item.isUser && (
        <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
          <Feather name="message-circle" size={20} color="#FFFFFF" />
        </View>
      )}
      
      <View
        style={[
          styles.messageBubble,
          item.isUser
            ? { backgroundColor: theme.primary }
            : { backgroundColor: theme.backgroundSecondary },
          item.isUser && styles.userBubble,
        ]}
      >
        <ThemedText
          style={[
            styles.messageText,
            item.isUser && { color: "#FFFFFF" },
          ]}
        >
          {item.text}
        </ThemedText>
      </View>

      {item.isUser && (
        <View style={[styles.avatarContainer, { backgroundColor: theme.accent }]}>
          <Feather name="user" size={20} color="#FFFFFF" />
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="h2">Help & Support</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Ask me anything about LootDrop AR
        </ThemedText>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messageList,
          { paddingBottom: insets.bottom + Spacing.xl }
        ]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundDefault,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + Spacing.md,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask a question..."
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={handleSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim() ? theme.primary : theme.backgroundSecondary,
            },
          ]}
          disabled={!inputText.trim()}
        >
          <Feather
            name="send"
            size={20}
            color={inputText.trim() ? "#FFFFFF" : theme.textSecondary}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontSize: 14,
  },
  messageList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    alignItems: "flex-end",
  },
  userMessageRow: {
    justifyContent: "flex-end",
  },
  botMessageRow: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: Spacing.sm,
  },
  messageBubble: {
    maxWidth: "70%",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
