import React, { useEffect, useMemo, useState } from "react";
import { useCollaborators } from "../../firebase/hooks";
import type { User } from "../../types";
import {
  decryptWithPrivateKey,
  encryptForRecipient,
  generateChatKeyBundle,
} from "../crypto";
import { usePrivateConversations, usePrivateMessages } from "../hooks";
import {
  getUserChatPublicKey,
  sendEncryptedMessage,
  upsertUserChatPublicKey,
} from "../service";
import type { ChatKeyBundle } from "../types";

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
  const [keyBundle, setKeyBundle] = useState<ChatKeyBundle | null>(null);
  const [decryptedTextById, setDecryptedTextById] = useState<
    Record<string, string>
  >({});

  const KEY_STORAGE_PREFIX = "rl_chat_keybundle_v1_";

  useEffect(() => {
    if (!appUser?.uid) return;

    const load = async () => {
      const storageKey = `${KEY_STORAGE_PREFIX}${appUser.uid}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatKeyBundle;
        setKeyBundle(parsed);
        await upsertUserChatPublicKey(appUser.uid, parsed.publicKeyJwk);
        return;
      }

      const generated = await generateChatKeyBundle();
      localStorage.setItem(storageKey, JSON.stringify(generated));
      setKeyBundle(generated);
      await upsertUserChatPublicKey(appUser.uid, generated.publicKeyJwk);
    };

    load().catch(() => {});
  }, [appUser?.uid]);

  useEffect(() => {
    if (!conversations.length) return;
    if (!selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

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
          } catch {
            return [message.id, "[Unable to decrypt]"] as const;
          }
        }),
      );

      setDecryptedTextById(Object.fromEntries(entries));
    };

    decodeAll().catch(() => {
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

  const inferredRecipientId = selectedConversation?.participants.find(
    (uid) => uid !== appUser?.uid,
  );

  const recipientId = inferredRecipientId || selectedRecipientId;
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
      });

      setSelectedConversationId(result.conversationId);
      setDraft("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message.";
      window.alert(message);
    } finally {
      setSending(false);
    }
  };

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

          <div
            className="mt-3 rounded-xl border p-2"
            style={{ borderColor: "#dbe5ef", background: "#f8fafc" }}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-xs font-bold m-0" style={{ color: "#334155" }}>
                Collaborators
              </p>
              <p className="text-[11px] m-0" style={{ color: "#64748b" }}>
                {filteredCollaborators.length} found
              </p>
            </div>

            <div className="max-h-[250px] overflow-y-auto pr-1 space-y-1">
              {filteredCollaborators.length === 0 ? (
                <p
                  className="text-sm px-2 py-6 text-center"
                  style={{ color: "#64748b" }}
                >
                  No collaborators match your search.
                </p>
              ) : (
                filteredCollaborators.map((collaborator) => {
                  const active = selectedRecipientId === collaborator.uid;
                  const label =
                    collaborator.name || collaborator.email || collaborator.uid;
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
                        setSelectedRecipientId(collaborator.uid);
                        setSelectedConversationId(undefined);
                      }}
                      className="w-full text-left rounded-xl p-2 border-none cursor-pointer transition-colors"
                      style={{
                        background: active ? "#dcfce7" : "#ffffff",
                        border: active
                          ? "1px solid #86efac"
                          : "1px solid #e5e7eb",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {renderAvatar({
                          name: label,
                          photo: collaborator.photo,
                          size: 38,
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

          <div className="mt-4">
            <p className="text-xs font-bold mb-2" style={{ color: "#334155" }}>
              Conversations
            </p>
            {loading ? (
              <p className="text-sm" style={{ color: "#64748b" }}>
                Loading conversations...
              </p>
            ) : conversations.length === 0 ? (
              <p className="text-sm" style={{ color: "#64748b" }}>
                No conversations yet.
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
                        onClick={() => {
                          setSelectedConversationId(conversation.id);
                          setSelectedRecipientId("");
                        }}
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
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div
          className="lg:col-span-2 rounded-2xl border p-3"
          style={{ borderColor: "#dbe5ef", background: "#ffffff" }}
        >
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
                    End-to-end encrypted
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

          <div
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
            ) : messages.length === 0 ? (
              <p className="text-sm" style={{ color: "#64748b" }}>
                No messages yet.
              </p>
            ) : (
              messages.map((message) => {
                const isMe = message.senderId === appUser?.uid;
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
                    style={{ justifyContent: isMe ? "flex-end" : "flex-start" }}
                  >
                    {!isMe &&
                      renderAvatar({
                        name: senderName,
                        photo: senderPhoto,
                        size: 28,
                        background: "#d1fae5",
                      })}
                    <div
                      className="rounded-2xl px-3 py-2 max-w-[75%]"
                      style={{
                        background: isMe ? "#dcf8c6" : "#ffffff",
                        color: "#1f2937",
                        boxShadow: "0 1px 1px rgba(15, 23, 42, 0.12)",
                        borderTopRightRadius: isMe ? 6 : 16,
                        borderTopLeftRadius: isMe ? 16 : 6,
                      }}
                    >
                      <p className="m-0 text-sm">
                        {decryptedTextById[message.id] ?? "Decrypting..."}
                      </p>
                      <p
                        className="m-0 mt-1 text-[11px]"
                        style={{ color: "#64748b" }}
                      >
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
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

          <div className="mt-3 flex gap-2 items-center">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
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
        </div>
      </div>
    </div>
  );
};

export default ChatWorkspace;
