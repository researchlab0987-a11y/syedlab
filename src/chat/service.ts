import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type {
  ChatConversation,
  ChatMessage,
  EncryptedMessagePayload,
} from "./types";

const CHAT_TTL_HOURS = 72;

const normalizeConversationId = (uidA: string, uidB: string) =>
  [uidA, uidB].sort().join("__");

const toIsoString = (value: unknown) => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
};

export const upsertConversation = async (
  uidA: string,
  uidB: string,
  participantNames?: Record<string, string>,
) => {
  const id = normalizeConversationId(uidA, uidB);
  const ref = doc(db, "privateChats", id);
  const now = new Date().toISOString();

  await setDoc(
    ref,
    {
      participants: [uidA, uidB],
      participantNames: participantNames ?? {},
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  return id;
};

export const sendEncryptedMessage = async (input: {
  senderId: string;
  recipientId: string;
  participantNames?: Record<string, string>;
  encryptedByUser: Record<string, EncryptedMessagePayload>;
}) => {
  const conversationId = await upsertConversation(
    input.senderId,
    input.recipientId,
    input.participantNames,
  );

  const createdAt = Timestamp.now();
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + CHAT_TTL_HOURS * 60 * 60 * 1000),
  );

  const messageRef = doc(
    collection(db, "privateChats", conversationId, "messages"),
  );

  await setDoc(messageRef, {
    conversationId,
    senderId: input.senderId,
    recipientId: input.recipientId,
    encryptedByUser: input.encryptedByUser,
    createdAt,
    expiresAt,
  });

  await updateDoc(doc(db, "privateChats", conversationId), {
    lastMessageAt: createdAt,
    updatedAt: createdAt,
    lastMessagePreview: "Encrypted message",
  });

  return { conversationId, messageId: messageRef.id };
};

export const subscribeConversations = (
  uid: string,
  onChange: (items: ChatConversation[]) => void,
) => {
  const q = query(collection(db, "privateChats"), orderBy("updatedAt", "desc"));

  return onSnapshot(q, (snap) => {
    const items = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      .filter((row: any) => {
        const participants = row.participants as string[] | undefined;
        return Array.isArray(participants) && participants.includes(uid);
      })
      .map((row: any) => ({
        id: String(row.id),
        participants: row.participants as string[],
        participantNames: (row.participantNames ?? {}) as Record<
          string,
          string
        >,
        lastMessagePreview:
          typeof row.lastMessagePreview === "string"
            ? row.lastMessagePreview
            : undefined,
        lastMessageAt: toIsoString(row.lastMessageAt),
        createdAt: toIsoString(row.createdAt),
        updatedAt: toIsoString(row.updatedAt),
      }));

    onChange(items);
  });
};

export const subscribeMessages = (
  conversationId: string,
  onChange: (items: ChatMessage[]) => void,
) => {
  const q = query(
    collection(db, "privateChats", conversationId, "messages"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => {
      const row = d.data();
      return {
        id: d.id,
        conversationId,
        senderId: String(row.senderId),
        recipientId: String(row.recipientId),
        encryptedByUser: (row.encryptedByUser ?? {}) as Record<
          string,
          EncryptedMessagePayload
        >,
        createdAt: toIsoString(row.createdAt),
        expiresAt: toIsoString(row.expiresAt),
        readAt: row.readAt ? toIsoString(row.readAt) : undefined,
      } as ChatMessage;
    });

    onChange(items);
  });
};

export const upsertUserChatPublicKey = async (
  uid: string,
  publicKeyJwk: JsonWebKey,
) => {
  await setDoc(
    doc(db, "users", uid),
    {
      chatPublicKeyJwk: publicKeyJwk,
      chatKeyUpdatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
};

export const getUserChatPublicKey = async (uid: string) => {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as { chatPublicKeyJwk?: JsonWebKey };
  return data.chatPublicKeyJwk ?? null;
};
