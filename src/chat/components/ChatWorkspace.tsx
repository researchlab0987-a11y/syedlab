import EmojiPicker from "emoji-picker-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCollaborators } from "../../firebase/hooks";
import type { User } from "../../types";
import {
  decryptWithPrivateKey,
  encryptForRecipient,
  generateChatKeyBundle,
} from "../crypto";
import { usePrivateConversations, usePrivateMessages } from "../hooks";
import {
  addReactionToMessage,
  deleteMessageForEveryoneBySender,
  editMessageBySender,
  getUserChatKeyBundle,
  getUserChatPublicKey,
  markConversationRead,
  removeReactionFromMessage,
  sendEncryptedMessage,
  setPinnedConversationMessage,
  setTypingStatus,
  upsertUserChatKeyBundle,
  upsertUserChatPublicKey,
} from "../service";
import type { ChatConversation, ChatKeyBundle } from "../types";

interface ChatWorkspaceProps {
  appUser: User | null;
}

const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({ appUser }) => {
  const { collaborators } = useCollaborators();
  const { conversations, loading } = usePrivateConversations(appUser?.uid);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(undefined);
  const { messages, loading: loadingMessages } = usePrivateMessages(
    selectedConversationId,
  );
  const [draft, setDraft] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [collaboratorSearch, setCollaboratorSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [mobilePane, setMobilePane] = useState<"list" | "chat">("list");
  const [keyBundle, setKeyBundle] = useState<ChatKeyBundle | null>(null);
  const [decryptedTextById, setDecryptedTextById] = useState<
    Record<string, string>
  >({});
  const [deletedForMeIds, setDeletedForMeIds] = useState<string[]>([]);
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [actionBusyMessageId, setActionBusyMessageId] = useState<string | null>(
    null,
  );
  const [fallbackRecentIds, setFallbackRecentIds] = useState<string[]>([]);
  const [emojiPickerMessageId, setEmojiPickerMessageId] = useState<
    string | null
  >(null);
  const messagePaneRef = useRef<HTMLDivElement>(null);
  const activeTypingConversationRef = useRef<string | undefined>(undefined);
  const typingDebounceRef = useRef<number | undefined>(undefined);

  const DELETE_FOR_ME_PREFIX = "rl_chat_deleted_for_me_v1_";
  const RECENTS_STORAGE_PREFIX = "rl_chat_recent_ids_v1_";

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobilePane("chat");
    } else if (!selectedConversationId && !selectedRecipientId) {
      setMobilePane("list");
    }
  }, [isMobile, selectedConversationId, selectedRecipientId]);

  useEffect(() => {
    if (!appUser?.uid) return;

    const load = async () => {
      // Try to fetch existing key bundle from Firestore
      const existingBundle = await getUserChatKeyBundle(appUser.uid);

      if (existingBundle) {
        console.log(
          `[Chat] Loaded key bundle from Firestore for user ${appUser.uid}`,
        );
        setKeyBundle(existingBundle);
        // Ensure public key is available for others to encrypt
        await upsertUserChatPublicKey(appUser.uid, existingBundle.publicKeyJwk);
        return;
      }

      // If no existing bundle, generate a new one
      console.log(`[Chat] Generating new key bundle for user ${appUser.uid}`);
      const generated = await generateChatKeyBundle();

      // Store the complete bundle in Firestore for cross-device access
      await upsertUserChatKeyBundle(appUser.uid, generated);
      // Ensure public key is available for others to encrypt
      await upsertUserChatPublicKey(appUser.uid, generated.publicKeyJwk);
      setKeyBundle(generated);
    };

    load().catch((error) => {
      console.error("[Chat] Error loading/generating chat key bundle:", error);
    });
  }, [appUser?.uid]);

  useEffect(() => {
    if (!appUser?.uid) {
      setFallbackRecentIds([]);
      return;
    }

    const storageKey = `${RECENTS_STORAGE_PREFIX}${appUser.uid}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      setFallbackRecentIds([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      setFallbackRecentIds(
        Array.isArray(parsed)
          ? parsed.filter((id) => typeof id === "string")
          : [],
      );
    } catch {
      setFallbackRecentIds([]);
    }
  }, [appUser?.uid]);

  useEffect(() => {
    if (!appUser?.uid || !selectedConversationId) {
      setDeletedForMeIds([]);
      return;
    }

    const storageKey = `${DELETE_FOR_ME_PREFIX}${appUser.uid}_${selectedConversationId}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      setDeletedForMeIds([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      setDeletedForMeIds(
        Array.isArray(parsed)
          ? parsed.filter((id) => typeof id === "string")
          : [],
      );
    } catch {
      setDeletedForMeIds([]);
    }
  }, [appUser?.uid, selectedConversationId]);

  useEffect(() => {
    if (!conversations.length) return;
    if (!selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
      if (isMobile) setMobilePane("chat");
    }
  }, [conversations, isMobile, selectedConversationId]);

  useEffect(() => {
    if (!appUser?.uid || !keyBundle) {
      setDecryptedTextById({});
      return;
    }

    const decodeAll = async () => {
      const entries = await Promise.all(
        messages.map(async (message) => {
          const payload = message.encryptedByUser[appUser.uid];
          if (!payload) {
            return [message.id, "[Encrypted for participant only]"] as const;
          }
          try {
            const plain = await decryptWithPrivateKey(
              payload,
              keyBundle.privateKeyJwk,
            );
            return [message.id, plain] as const;
          } catch (error) {
            console.warn(
              `[Chat] Failed to decrypt message ${message.id}. Reason: ${
                error instanceof Error ? error.message : "Unknown error"
              }. This may indicate the encryption key was regenerated or your browser storage was cleared. Old messages encrypted with previous keys cannot be decrypted.`,
            );
            return [message.id, "[Unable to decrypt]"] as const;
          }
        }),
      );

      setDecryptedTextById(Object.fromEntries(entries));
    };

    decodeAll().catch((error) => {
      console.error("[Chat] Error decoding messages:", error);
      setDecryptedTextById({});
    });
  }, [appUser?.uid, keyBundle, messages]);

  const collaboratorsForChat = useMemo(
    () => collaborators.filter((c) => c.uid && c.uid !== appUser?.uid),
    [appUser?.uid, collaborators],
  );

  const filteredCollaborators = useMemo(() => {
    const q = collaboratorSearch.trim().toLowerCase();
    if (!q) return collaboratorsForChat;

    return collaboratorsForChat.filter((collaborator) => {
      const haystack = [
        collaborator.name,
        collaborator.email,
        collaborator.designation,
        collaborator.affiliation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [collaboratorSearch, collaboratorsForChat]);

  const collaboratorsByUid = useMemo(() => {
    const map = new Map<string, (typeof collaborators)[number]>();
    collaborators.forEach((item) => {
      map.set(item.uid, item);
    });
    return map;
  }, [collaborators]);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId,
  );
  const pinnedMessageId = selectedConversation?.pinnedMessageId;

  const deletedForMeSet = useMemo(
    () => new Set(deletedForMeIds),
    [deletedForMeIds],
  );

  const visibleMessages = useMemo(
    () => messages.filter((message) => !deletedForMeSet.has(message.id)),
    [deletedForMeSet, messages],
  );

  const messageById = useMemo(() => {
    const map = new Map<string, (typeof messages)[number]>();
    messages.forEach((message) => {
      map.set(message.id, message);
    });
    return map;
  }, [messages]);

  const pinnedMessage = pinnedMessageId
    ? messageById.get(pinnedMessageId)
    : undefined;

  const inferredRecipientId = selectedConversation?.participants.find(
    (uid) => uid !== appUser?.uid,
  );

  const recipientId = inferredRecipientId || selectedRecipientId;

  const pushFallbackRecent = (conversationId: string) => {
    if (!appUser?.uid || !conversationId) return;

    setFallbackRecentIds((prev) => {
      const next = [
        conversationId,
        ...prev.filter((id) => id !== conversationId),
      ].slice(0, 20);
      const storageKey = `${RECENTS_STORAGE_PREFIX}${appUser.uid}`;
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const recentConversations = useMemo<ChatConversation[]>(() => {
    if (!appUser?.uid) return conversations;

    if (conversations.length > 0) return conversations;

    return fallbackRecentIds.map((id) => {
      const parts = id.split("__");
      const otherUid = parts.find((part) => part !== appUser.uid) || "";
      const otherProfile = collaboratorsByUid.get(otherUid);

      return {
        id,
        participants: [appUser.uid, otherUid].filter(Boolean).sort(),
        participantNames: {
          [appUser.uid]: appUser.name,
          ...(otherUid ? { [otherUid]: otherProfile?.name || otherUid } : {}),
        },
        lastMessagePreview: "Encrypted message",
        lastMessageAt: undefined,
        unreadCounts: {},
        typingBy: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }, [
    appUser?.name,
    appUser?.uid,
    collaboratorsByUid,
    conversations,
    fallbackRecentIds,
  ]);

  const conversationByOtherUid = useMemo(() => {
    const map = new Map<string, (typeof conversations)[number]>();
    conversations.forEach((conversation) => {
      const other = conversation.participants.find(
        (uid) => uid !== appUser?.uid,
      );
      if (other) map.set(other, conversation);
    });
    return map;
  }, [appUser?.uid, conversations]);

  const unreadCountForMe = (conversation?: (typeof conversations)[number]) => {
    if (!conversation || !appUser?.uid) return 0;
    return Number(conversation.unreadCounts?.[appUser.uid] ?? 0);
  };

  const isRecipientTyping = useMemo(() => {
    if (!recipientId || !selectedConversation) return false;
    const raw = selectedConversation.typingBy?.[recipientId];
    if (!raw) return false;
    const typingAt = Date.parse(raw);
    if (Number.isNaN(typingAt)) return false;
    return Date.now() - typingAt < 8000;
  }, [recipientId, selectedConversation]);

  const formatTime = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    if (inferredRecipientId && inferredRecipientId !== selectedRecipientId) {
      setSelectedRecipientId(inferredRecipientId);
    }
  }, [inferredRecipientId, selectedRecipientId]);

  useEffect(() => {
    setReplyToMessageId(null);
    setMenuMessageId(null);
    setEditingMessageId(null);
    setEditDraft("");
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId || !recipientId) return;
    pushFallbackRecent(selectedConversationId);
  }, [recipientId, selectedConversationId]);

  useEffect(() => {
    const pane = messagePaneRef.current;
    if (!pane) return;
    pane.scrollTop = pane.scrollHeight;
  }, [visibleMessages.length]);

  useEffect(() => {
    if (!appUser?.uid || !selectedConversationId || !visibleMessages.length)
      return;

    const unreadMessageIds = visibleMessages
      .filter(
        (message) => message.recipientId === appUser.uid && !message.readAt,
      )
      .map((message) => message.id);

    if (!unreadMessageIds.length) return;

    markConversationRead(
      selectedConversationId,
      appUser.uid,
      unreadMessageIds,
    ).catch(() => {});
  }, [appUser?.uid, selectedConversationId, visibleMessages]);

  useEffect(() => {
    const uid = appUser?.uid;
    if (!uid) return;

    const previousConversationId = activeTypingConversationRef.current;
    if (
      previousConversationId &&
      selectedConversationId &&
      previousConversationId !== selectedConversationId
    ) {
      setTypingStatus(previousConversationId, uid, false).catch(() => {});
    }

    activeTypingConversationRef.current = selectedConversationId;
  }, [appUser?.uid, selectedConversationId]);

  useEffect(() => {
    const uid = appUser?.uid;
    if (!uid || !selectedConversationId || !recipientId) return;

    const isTyping = draft.trim().length > 0;

    if (typingDebounceRef.current) {
      window.clearTimeout(typingDebounceRef.current);
    }

    typingDebounceRef.current = window.setTimeout(() => {
      setTypingStatus(selectedConversationId, uid, isTyping).catch(() => {});
    }, 250);

    return () => {
      if (typingDebounceRef.current) {
        window.clearTimeout(typingDebounceRef.current);
      }
    };
  }, [appUser?.uid, draft, recipientId, selectedConversationId]);

  useEffect(() => {
    return () => {
      const uid = appUser?.uid;
      const conversationId = activeTypingConversationRef.current;
      if (uid && conversationId) {
        setTypingStatus(conversationId, uid, false).catch(() => {});
      }
    };
  }, [appUser?.uid]);

  const conversationIdFor = (a: string, b: string) => [a, b].sort().join("__");

  const activateCollaborator = (uid: string) => {
    if (!appUser?.uid) return;
    setSelectedRecipientId(uid);
    const conversationId = conversationIdFor(appUser.uid, uid);
    setSelectedConversationId(conversationId);
    pushFallbackRecent(conversationId);
    if (isMobile) setMobilePane("chat");
  };

  const activateConversation = (conversationId: string, otherUid?: string) => {
    setSelectedConversationId(conversationId);
    pushFallbackRecent(conversationId);
    if (otherUid) setSelectedRecipientId(otherUid);
    setCollaboratorSearch("");
    if (isMobile) setMobilePane("chat");
  };

  const selectedRecipient = recipientId
    ? collaboratorsByUid.get(recipientId)
    : null;

  const getInitials = (name: string) => {
    const parts = name
      .split(" ")
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 2);
    if (!parts.length) return "U";
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  };

  const renderAvatar = (opts: {
    name: string;
    photo?: string;
    size?: number;
    background?: string;
  }) => {
    const size = opts.size ?? 36;
    const baseStyle = {
      width: size,
      height: size,
      minWidth: size,
      borderRadius: "50%",
    } as const;

    if (opts.photo) {
      return (
        <img
          src={opts.photo}
          alt={opts.name}
          style={{ ...baseStyle, objectFit: "cover" }}
        />
      );
    }

    return (
      <div
        style={{
          ...baseStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: opts.background ?? "#d1fae5",
          color: "#065f46",
          fontWeight: 800,
          fontSize: Math.max(11, Math.floor(size * 0.34)),
        }}
      >
        {getInitials(opts.name)}
      </div>
    );
  };

  const sendMessage = async () => {
    if (!appUser?.uid || !keyBundle || !recipientId || !draft.trim()) return;

    setSending(true);
    try {
      const recipientKey = await getUserChatPublicKey(recipientId);
      if (!recipientKey) {
        throw new Error(
          "Recipient chat key is not available yet. Ask them to sign in once so their key can be provisioned.",
        );
      }

      const recipientPayload = await encryptForRecipient(
        draft.trim(),
        recipientKey,
      );
      const senderPayload = await encryptForRecipient(
        draft.trim(),
        keyBundle.publicKeyJwk,
      );

      const recipient = collaboratorsForChat.find((c) => c.uid === recipientId);

      const result = await sendEncryptedMessage({
        senderId: appUser.uid,
        recipientId,
        participantNames: {
          [appUser.uid]: appUser.name,
          [recipientId]: recipient?.name ?? recipientId,
        },
        encryptedByUser: {
          [appUser.uid]: senderPayload,
          [recipientId]: recipientPayload,
        },
        replyToMessageId: replyToMessageId ?? undefined,
      });

      setSelectedConversationId(result.conversationId);
      pushFallbackRecent(result.conversationId);
      setDraft("");
      setReplyToMessageId(null);
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code ?? "")
          : "";

      if (code.includes("permission-denied")) {
        window.alert(
          "Missing or insufficient permissions. Please sign out and sign in again once, then retry sending.",
        );
      } else {
        const message =
          error instanceof Error ? error.message : "Failed to send message.";
        window.alert(message);
      }
    } finally {
      setSending(false);
    }
  };

  const persistDeletedForMeIds = (ids: string[]) => {
    if (!appUser?.uid || !selectedConversationId) return;
    const storageKey = `${DELETE_FOR_ME_PREFIX}${appUser.uid}_${selectedConversationId}`;
    localStorage.setItem(storageKey, JSON.stringify(ids));
  };

  const deleteForMe = (messageId: string) => {
    setDeletedForMeIds((prev) => {
      const next = Array.from(new Set([...prev, messageId]));
      persistDeletedForMeIds(next);
      return next;
    });

    if (editingMessageId === messageId) {
      setEditingMessageId(null);
      setEditDraft("");
    }

    setMenuMessageId(null);
  };

  const copyMessageText = async (messageId: string) => {
    const text = decryptedTextById[messageId] ?? "";
    if (!text || text.startsWith("[")) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.alert("Unable to copy message text.");
    }

    setMenuMessageId(null);
  };

  const startEditMessage = (messageId: string) => {
    const current = decryptedTextById[messageId] ?? "";
    if (!current || current.startsWith("[")) return;
    setEditingMessageId(messageId);
    setEditDraft(current);
    setMenuMessageId(null);
  };

  const saveEditedMessage = async () => {
    if (
      !appUser?.uid ||
      !keyBundle ||
      !selectedConversationId ||
      !editingMessageId
    )
      return;

    const message = messages.find((item) => item.id === editingMessageId);
    if (!message || message.senderId !== appUser.uid) return;

    const nextText = editDraft.trim();
    if (!nextText) return;

    setActionBusyMessageId(editingMessageId);

    try {
      const recipientKey = await getUserChatPublicKey(message.recipientId);
      if (!recipientKey) {
        throw new Error("Recipient chat key is not available for editing.");
      }

      const recipientPayload = await encryptForRecipient(
        nextText,
        recipientKey,
      );
      const senderPayload = await encryptForRecipient(
        nextText,
        keyBundle.publicKeyJwk,
      );

      await editMessageBySender({
        conversationId: selectedConversationId,
        messageId: editingMessageId,
        encryptedByUser: {
          [appUser.uid]: senderPayload,
          [message.recipientId]: recipientPayload,
        },
      });

      setEditingMessageId(null);
      setEditDraft("");
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Failed to edit message.";
      window.alert(messageText);
    } finally {
      setActionBusyMessageId(null);
    }
  };

  const deleteForEveryone = async (messageId: string) => {
    if (!selectedConversationId) return;

    setActionBusyMessageId(messageId);

    try {
      await deleteMessageForEveryoneBySender(selectedConversationId, messageId);

      if (editingMessageId === messageId) {
        setEditingMessageId(null);
        setEditDraft("");
      }
    } catch {
      window.alert("Failed to delete message for everyone.");
    } finally {
      setMenuMessageId(null);
      setActionBusyMessageId(null);
    }
  };

  const pinMessage = async (messageId: string) => {
    if (!selectedConversationId) return;

    setActionBusyMessageId(messageId);
    try {
      await setPinnedConversationMessage(selectedConversationId, messageId);
    } catch {
      window.alert("Failed to pin message.");
    } finally {
      setMenuMessageId(null);
      setActionBusyMessageId(null);
    }
  };

  const unpinMessage = async (messageId: string) => {
    if (!selectedConversationId) return;

    setActionBusyMessageId(messageId);
    try {
      await setPinnedConversationMessage(selectedConversationId, null);
    } catch {
      window.alert("Failed to unpin message.");
    } finally {
      setMenuMessageId(null);
      setActionBusyMessageId(null);
    }
  };

  const startReply = (messageId: string) => {
    setReplyToMessageId(messageId);
    setMenuMessageId(null);
  };

  const handleAddReaction = async (emoji: string, messageId: string) => {
    if (!appUser?.uid || !selectedConversationId) return;

    setActionBusyMessageId(messageId);
    try {
      await addReactionToMessage(
        selectedConversationId,
        messageId,
        emoji,
        appUser.uid,
      );
    } catch {
      window.alert("Failed to add reaction.");
    } finally {
      setEmojiPickerMessageId(null);
      setActionBusyMessageId(null);
    }
  };

  const handleRemoveReaction = async (emoji: string, messageId: string) => {
    if (!appUser?.uid || !selectedConversationId) return;

    setActionBusyMessageId(messageId);
    try {
      await removeReactionFromMessage(
        selectedConversationId,
        messageId,
        emoji,
        appUser.uid,
      );
    } catch {
      window.alert("Failed to remove reaction.");
    } finally {
      setActionBusyMessageId(null);
    }
  };

  const handleReactionClick = async (emoji: string, messageId: string) => {
    if (!appUser?.uid) return;

    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const hasReacted = message.reactions?.[emoji]?.includes(appUser.uid);

    if (hasReacted) {
      await handleRemoveReaction(emoji, messageId);
    } else {
      await handleAddReaction(emoji, messageId);
    }
  };

  const replyMessage = replyToMessageId
    ? messageById.get(replyToMessageId)
    : undefined;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        background: "linear-gradient(180deg, #f7fbff 0%, #eef8f3 100%)",
        borderColor: "rgba(148,163,184,0.25)",
      }}
    >
      <h2
        className="font-black text-xl"
        style={{
          color: "var(--color-primary)",
          fontFamily: "var(--font-heading)",
        }}
      >
        Private Chat
      </h2>
      <p className="text-sm mt-1" style={{ color: "#64748b" }}>
        End-to-end encrypted collaborator conversations (auto-expire after 3
        days).
      </p>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(!isMobile || mobilePane === "list") && (
          <div
            className="rounded-2xl border p-3"
            style={{ borderColor: "#dbe5ef", background: "#ffffff" }}
          >
            <p className="text-xs font-bold mb-2" style={{ color: "#334155" }}>
              New chat
            </p>
            <div className="relative">
              <input
                value={collaboratorSearch}
                onChange={(e) => setCollaboratorSearch(e.target.value)}
                placeholder="Search collaborator..."
                className="w-full text-sm rounded-xl px-3 py-2"
                style={{ border: "1px solid #cbd5e1" }}
              />
              {collaboratorSearch && (
                <button
                  type="button"
                  onClick={() => setCollaboratorSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold"
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {collaboratorSearch.trim() && (
              <div
                className="mt-2 rounded-xl border p-2"
                style={{ borderColor: "#dbe5ef", background: "#f8fafc" }}
              >
                <div className="flex items-center justify-between px-1 pb-2">
                  <p
                    className="text-xs font-bold m-0"
                    style={{ color: "#334155" }}
                  >
                    Search results
                  </p>
                  <p className="text-[11px] m-0" style={{ color: "#64748b" }}>
                    {filteredCollaborators.length}
                  </p>
                </div>

                <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1">
                  {filteredCollaborators.length === 0 ? (
                    <p
                      className="text-sm px-2 py-4 text-center"
                      style={{ color: "#64748b" }}
                    >
                      No collaborators match your search.
                    </p>
                  ) : (
                    filteredCollaborators.map((collaborator) => {
                      const label =
                        collaborator.name ||
                        collaborator.email ||
                        collaborator.uid;
                      const subtitle =
                        collaborator.designation ||
                        collaborator.affiliation ||
                        collaborator.email ||
                        "Available collaborator";

                      return (
                        <button
                          key={collaborator.uid}
                          type="button"
                          onClick={() => {
                            activateCollaborator(collaborator.uid);
                            setCollaboratorSearch("");
                          }}
                          className="w-full text-left rounded-xl p-2 border-none cursor-pointer transition-colors"
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {renderAvatar({
                              name: label,
                              photo: collaborator.photo,
                              size: 36,
                              background: "#d1fae5",
                            })}
                            <div className="min-w-0 flex-1">
                              <p
                                className="m-0 text-sm font-semibold truncate"
                                style={{ color: "#1f2937" }}
                              >
                                {label}
                              </p>
                              <p
                                className="m-0 text-[11px] truncate"
                                style={{ color: "#64748b" }}
                              >
                                {subtitle}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div
              className="mt-3 rounded-xl border p-2"
              style={{ borderColor: "#dbe5ef", background: "#f8fafc" }}
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <p
                  className="text-xs font-bold m-0"
                  style={{ color: "#334155" }}
                >
                  Recent chats
                </p>
                <p className="text-[11px] m-0" style={{ color: "#64748b" }}>
                  {recentConversations.length}
                </p>
              </div>

              {loading ? (
                <p className="text-sm px-2 py-2" style={{ color: "#64748b" }}>
                  Loading conversations...
                </p>
              ) : recentConversations.length === 0 ? (
                <p className="text-sm px-2 py-2" style={{ color: "#64748b" }}>
                  No recent chats yet.
                </p>
              ) : (
                <div className="max-h-[210px] overflow-y-auto pr-1 space-y-1 mb-3">
                  {recentConversations.map((conversation) => {
                    const other = conversation.participants.find(
                      (uid) => uid !== appUser?.uid,
                    );
                    const otherProfile = other
                      ? collaboratorsByUid.get(other)
                      : undefined;
                    const label =
                      (other && conversation.participantNames?.[other]) ||
                      otherProfile?.name ||
                      other ||
                      "Unknown";
                    const unreadCount = unreadCountForMe(conversation);

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() =>
                          activateConversation(conversation.id, other)
                        }
                        className="w-full text-left rounded-xl p-2 border-none cursor-pointer"
                        style={{
                          background:
                            selectedConversationId === conversation.id
                              ? "#dcfce7"
                              : "#ffffff",
                          border:
                            selectedConversationId === conversation.id
                              ? "1px solid #86efac"
                              : "1px solid #e2e8f0",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {renderAvatar({
                            name: label,
                            photo: otherProfile?.photo,
                            size: 34,
                            background: "#dcfce7",
                          })}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className="m-0 text-sm font-semibold truncate"
                                style={{ color: "#1f2937" }}
                              >
                                {label}
                              </p>
                              <p
                                className="m-0 text-[11px]"
                                style={{ color: "#64748b" }}
                              >
                                {formatTime(
                                  conversation.lastMessageAt ||
                                    conversation.updatedAt,
                                )}
                              </p>
                            </div>
                            <p
                              className="m-0 text-xs truncate"
                              style={{ color: "#64748b" }}
                            >
                              {conversation.lastMessagePreview ??
                                "Encrypted message"}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: "#22c55e",
                                color: "#ffffff",
                              }}
                            >
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4">
              <p
                className="text-xs font-bold mb-2"
                style={{ color: "#334155" }}
              >
                Conversations
              </p>
              {loading ? (
                <p className="text-sm" style={{ color: "#64748b" }}>
                  Loading conversations...
                </p>
              ) : (
                <ul
                  className="m-0 p-0 max-h-[260px] overflow-y-auto pr-1"
                  style={{ listStyle: "none" }}
                >
                  {conversations.map((conversation) => {
                    const other = conversation.participants.find(
                      (uid) => uid !== appUser?.uid,
                    );
                    const unreadCount = unreadCountForMe(conversation);
                    const otherProfile = other
                      ? collaboratorsByUid.get(other)
                      : undefined;
                    const label =
                      (other && conversation.participantNames?.[other]) ||
                      other ||
                      "Unknown";
                    return (
                      <li key={conversation.id} className="mb-1">
                        <button
                          onClick={() =>
                            activateConversation(conversation.id, other)
                          }
                          className="w-full text-left rounded-xl px-2 py-2 border-none cursor-pointer"
                          style={{
                            background:
                              selectedConversationId === conversation.id
                                ? "#dcfce7"
                                : "transparent",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {renderAvatar({
                              name: label,
                              photo: otherProfile?.photo,
                              size: 34,
                              background: "#dcfce7",
                            })}
                            <div className="min-w-0">
                              <p
                                className="m-0 text-sm font-semibold truncate"
                                style={{ color: "#1f2937" }}
                              >
                                {label}
                              </p>
                              <p
                                className="m-0 text-xs truncate"
                                style={{ color: "#64748b" }}
                              >
                                {conversation.lastMessagePreview ??
                                  "Encrypted message"}
                              </p>
                            </div>
                            {unreadCount > 0 && (
                              <span
                                className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: "#22c55e",
                                  color: "#ffffff",
                                }}
                              >
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {(!isMobile || mobilePane === "chat") && (
          <div
            className="lg:col-span-2 rounded-2xl border p-3"
            style={{ borderColor: "#dbe5ef", background: "#ffffff" }}
          >
            {isMobile && (
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => setMobilePane("list")}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border-none"
                  style={{
                    background: "#e2e8f0",
                    color: "#1f2937",
                    cursor: "pointer",
                  }}
                >
                  ← Back to chats
                </button>
              </div>
            )}
            <div
              className="mb-3 rounded-xl border px-3 py-2 flex items-center gap-2"
              style={{ borderColor: "#d9f99d", background: "#f0fdf4" }}
            >
              {recipientId ? (
                <>
                  {renderAvatar({
                    name:
                      selectedRecipient?.name || selectedRecipientId || "User",
                    photo: selectedRecipient?.photo,
                    size: 34,
                    background: "#bbf7d0",
                  })}
                  <div>
                    <p
                      className="m-0 text-sm font-bold"
                      style={{ color: "#14532d" }}
                    >
                      {selectedRecipient?.name || selectedRecipientId}
                    </p>
                    <p className="m-0 text-xs" style={{ color: "#166534" }}>
                      {isRecipientTyping ? "Typing..." : "End-to-end encrypted"}
                    </p>
                  </div>
                </>
              ) : (
                <p
                  className="m-0 text-xs font-semibold"
                  style={{ color: "#166534" }}
                >
                  Select a collaborator to start secure messaging.
                </p>
              )}
            </div>

            {pinnedMessage && (
              <div
                className="mb-2 rounded-lg border px-3 py-2"
                style={{ borderColor: "#fde68a", background: "#fffbeb" }}
              >
                <p
                  className="m-0 text-[11px] font-bold"
                  style={{ color: "#92400e" }}
                >
                  Pinned message
                </p>
                <p className="m-0 text-sm" style={{ color: "#78350f" }}>
                  {pinnedMessage.deletedForEveryoneAt
                    ? "This message was deleted"
                    : (decryptedTextById[pinnedMessage.id] ??
                      "Encrypted message")}
                </p>
              </div>
            )}

            <div
              ref={messagePaneRef}
              className="min-h-[300px] max-h-[420px] overflow-y-auto pr-1 rounded-xl border p-3"
              style={{
                borderColor: "#dbe5ef",
                background:
                  "radial-gradient(circle at 10px 10px, #f8fafc 2px, #f1f5f9 2px) 0 0 / 20px 20px",
              }}
            >
              {loadingMessages ? (
                <p className="text-sm" style={{ color: "#64748b" }}>
                  Loading messages...
                </p>
              ) : !recipientId ? (
                <p className="text-sm" style={{ color: "#64748b" }}>
                  Select a collaborator to load messages.
                </p>
              ) : visibleMessages.length === 0 ? (
                <p className="text-sm" style={{ color: "#64748b" }}>
                  No messages yet.
                </p>
              ) : (
                visibleMessages.map((message) => {
                  const isMe = message.senderId === appUser?.uid;
                  const isDeletedForEveryone = Boolean(
                    message.deletedForEveryoneAt,
                  );
                  const isPinned = pinnedMessageId === message.id;
                  const repliedMessage = message.replyToMessageId
                    ? messageById.get(message.replyToMessageId)
                    : undefined;
                  const repliedByMe = repliedMessage?.senderId === appUser?.uid;
                  const repliedText = repliedMessage
                    ? repliedMessage.deletedForEveryoneAt
                      ? "This message was deleted"
                      : (decryptedTextById[repliedMessage.id] ??
                        "Encrypted message")
                    : "Original message unavailable";
                  const senderName = isMe
                    ? appUser?.name || "You"
                    : collaboratorsByUid.get(message.senderId)?.name ||
                      selectedRecipient?.name ||
                      "Collaborator";
                  const senderPhoto = isMe
                    ? collaboratorsByUid.get(appUser?.uid || "")?.photo
                    : collaboratorsByUid.get(message.senderId)?.photo;

                  return (
                    <div
                      key={message.id}
                      className="mb-2 flex items-end gap-2"
                      style={{
                        justifyContent: isMe ? "flex-end" : "flex-start",
                      }}
                    >
                      {!isMe &&
                        renderAvatar({
                          name: senderName,
                          photo: senderPhoto,
                          size: 28,
                          background: "#d1fae5",
                        })}
                      <div
                        className="rounded-2xl px-3 py-2 max-w-[75%] relative"
                        style={{
                          background: isMe ? "#dcf8c6" : "#ffffff",
                          color: "#1f2937",
                          boxShadow: "0 1px 1px rgba(15, 23, 42, 0.12)",
                          borderTopRightRadius: isMe ? 6 : 16,
                          borderTopLeftRadius: isMe ? 16 : 6,
                        }}
                      >
                        <div className="absolute right-1 top-1">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuMessageId((prev) =>
                                prev === message.id ? null : message.id,
                              )
                            }
                            className="text-xs px-1.5 py-0.5 rounded border-none"
                            style={{
                              background: "rgba(15,23,42,0.08)",
                              color: "#334155",
                              cursor: "pointer",
                            }}
                          >
                            ⋮
                          </button>
                          {menuMessageId === message.id && (
                            <>
                              <div
                                className="fixed inset-0 z-[5]"
                                onClick={() => setMenuMessageId(null)}
                              />
                              <div
                                className="absolute right-0 mt-1 rounded-lg border p-1 z-[10] min-w-[150px]"
                                style={{
                                  background: "#ffffff",
                                  borderColor: "#dbe5ef",
                                  boxShadow:
                                    "0 6px 18px rgba(15, 23, 42, 0.16)",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEmojiPickerMessageId(message.id)
                                  }
                                  className="w-full text-left text-xs px-2 py-1 rounded border-none"
                                  style={{
                                    background: "transparent",
                                    color: "#1f2937",
                                    cursor: "pointer",
                                  }}
                                >
                                  React
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startReply(message.id)}
                                  className="w-full text-left text-xs px-2 py-1 rounded border-none"
                                  style={{
                                    background: "transparent",
                                    color: "#1f2937",
                                    cursor: "pointer",
                                  }}
                                >
                                  Reply
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isPinned) {
                                      void unpinMessage(message.id);
                                    } else {
                                      void pinMessage(message.id);
                                    }
                                  }}
                                  className="w-full text-left text-xs px-2 py-1 rounded border-none"
                                  style={{
                                    background: "transparent",
                                    color: "#1f2937",
                                    cursor: "pointer",
                                  }}
                                >
                                  {actionBusyMessageId === message.id
                                    ? "Please wait..."
                                    : isPinned
                                      ? "Unpin"
                                      : "Pin"}
                                </button>
                                {isMe && !isDeletedForEveryone && (
                                  <button
                                    type="button"
                                    onClick={() => startEditMessage(message.id)}
                                    className="w-full text-left text-xs px-2 py-1 rounded border-none"
                                    style={{
                                      background: "transparent",
                                      color: "#1f2937",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    void copyMessageText(message.id);
                                  }}
                                  className="w-full text-left text-xs px-2 py-1 rounded border-none"
                                  style={{
                                    background: "transparent",
                                    color: "#1f2937",
                                    cursor: "pointer",
                                  }}
                                >
                                  Copy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteForMe(message.id)}
                                  className="w-full text-left text-xs px-2 py-1 rounded border-none"
                                  style={{
                                    background: "transparent",
                                    color: "#1f2937",
                                    cursor: "pointer",
                                  }}
                                >
                                  Delete for me
                                </button>
                                {isMe && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void deleteForEveryone(message.id);
                                    }}
                                    className="w-full text-left text-xs px-2 py-1 rounded border-none"
                                    style={{
                                      background: "transparent",
                                      color: "#b91c1c",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {actionBusyMessageId === message.id
                                      ? "Deleting..."
                                      : "Delete for everyone"}
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {editingMessageId === message.id && isMe ? (
                          <div className="mt-5">
                            <input
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              className="w-full text-sm rounded-lg px-2 py-1"
                              style={{
                                border: "1px solid #a7f3d0",
                                background: "#ffffff",
                              }}
                            />
                            <div className="mt-1 flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditDraft("");
                                }}
                                className="text-xs font-semibold px-2 py-1 rounded border-none"
                                style={{
                                  background: "#e2e8f0",
                                  color: "#334155",
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  void saveEditedMessage();
                                }}
                                className="text-xs font-semibold px-2 py-1 rounded border-none text-white"
                                style={{ background: "#16a34a" }}
                              >
                                {actionBusyMessageId === message.id
                                  ? "Saving..."
                                  : "Save"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {message.replyToMessageId && (
                              <div
                                className="mt-4 mb-1 rounded-md px-2 py-1"
                                style={{
                                  background: "rgba(15,23,42,0.06)",
                                  borderLeft: "2px solid #84cc16",
                                }}
                              >
                                <p
                                  className="m-0 text-[10px] font-semibold"
                                  style={{ color: "#475569" }}
                                >
                                  Replying to{" "}
                                  {repliedByMe ? "you" : "collaborator"}
                                </p>
                                <p
                                  className="m-0 text-[11px] truncate"
                                  style={{ color: "#334155" }}
                                >
                                  {repliedText}
                                </p>
                              </div>
                            )}
                            <p className="m-0 text-sm mt-1">
                              {isDeletedForEveryone
                                ? "This message was deleted"
                                : (decryptedTextById[message.id] ??
                                  "Decrypting...")}
                            </p>
                          </>
                        )}
                        <p
                          className="m-0 mt-1 text-[11px]"
                          style={{ color: "#64748b" }}
                        >
                          {new Date(message.createdAt).toLocaleString()}
                          {message.editedAt && !isDeletedForEveryone
                            ? " • Edited"
                            : ""}
                          {isMe
                            ? ` • ${message.readAt ? `Seen ${formatTime(message.readAt)}` : "Sent"}`
                            : ""}
                        </p>
                        {message.reactions &&
                          Object.keys(message.reactions).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {Object.entries(message.reactions).map(
                                ([emoji, reactors]) => {
                                  const hasReacted = reactors.includes(
                                    appUser?.uid || "",
                                  );
                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() =>
                                        handleReactionClick(emoji, message.id)
                                      }
                                      className="rounded-full px-2 py-0.5 text-xs border"
                                      style={{
                                        background: hasReacted
                                          ? "#c8e6c9"
                                          : "#f5f5f5",
                                        borderColor: hasReacted
                                          ? "#81c784"
                                          : "#e0e0e0",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {emoji} {reactors.length}
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          )}
                      </div>
                      {isMe &&
                        renderAvatar({
                          name: appUser?.name || "You",
                          photo: senderPhoto,
                          size: 28,
                          background: "#bbf7d0",
                        })}
                    </div>
                  );
                })
              )}
            </div>

            {replyMessage && (
              <div
                className="mt-3 mb-1 rounded-lg border px-3 py-2 flex items-center justify-between gap-2"
                style={{ borderColor: "#bae6fd", background: "#f0f9ff" }}
              >
                <div className="min-w-0">
                  <p
                    className="m-0 text-[11px] font-bold"
                    style={{ color: "#075985" }}
                  >
                    Replying to{" "}
                    {replyMessage.senderId === appUser?.uid
                      ? "your message"
                      : "collaborator"}
                  </p>
                  <p
                    className="m-0 text-xs truncate"
                    style={{ color: "#0f172a" }}
                  >
                    {replyMessage.deletedForEveryoneAt
                      ? "This message was deleted"
                      : (decryptedTextById[replyMessage.id] ??
                        "Encrypted message")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyToMessageId(null)}
                  className="text-xs font-semibold px-2 py-1 rounded border-none"
                  style={{ background: "#e2e8f0", color: "#334155" }}
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="mt-3 flex gap-2 items-center">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder={
                  recipientId
                    ? "Write an encrypted message..."
                    : "Select a collaborator first"
                }
                className="flex-1 text-sm rounded-full px-4 py-2"
                style={{ border: "1px solid #cbd5e1", background: "#ffffff" }}
              />
              <button
                onClick={sendMessage}
                disabled={!recipientId || !draft.trim() || sending}
                className="text-sm font-bold px-5 py-2 rounded-full border-none text-white disabled:opacity-60"
                style={{ background: "#16a34a" }}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>

            {emojiPickerMessageId && (
              <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{ background: "rgba(0, 0, 0, 0.3)" }}
                onClick={() => setEmojiPickerMessageId(null)}
              >
                <div
                  className="rounded-lg p-2"
                  style={{ background: "#ffffff" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <EmojiPicker
                    onEmojiClick={(emojiObject) => {
                      void handleAddReaction(
                        emojiObject.emoji,
                        emojiPickerMessageId,
                      );
                    }}
                    width={320}
                    height={400}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWorkspace;
