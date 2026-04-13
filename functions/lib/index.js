import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import nodemailer from "nodemailer";
setGlobalOptions({ region: "asia-south1" });
initializeApp();
const db = getFirestore();
const INACTIVE_THRESHOLD_MS = 5 * 60 * 1000;
const EMAIL_COOLDOWN_MS = 30 * 60 * 1000;
const toMillis = (value) => {
    if (!value)
        return NaN;
    if (typeof value === "string")
        return Date.parse(value);
    if (typeof value === "object" &&
        value !== null &&
        "toDate" in value &&
        typeof value.toDate === "function") {
        return value.toDate().getTime();
    }
    return NaN;
};
const getEmailTransport = () => {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT ?? 587);
    if (!host || !user || !pass)
        return null;
    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
};
const logNotificationEvent = async (input) => {
    await db.collection("privateChatNotificationEvents").add({
        ...input,
        createdAt: new Date().toISOString(),
    });
};
export const createGalleryItem = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Sign in required.");
    }
    const title = String(request.data?.title ?? "").trim();
    const description = String(request.data?.description ?? "").trim();
    const imageUrl = String(request.data?.imageUrl ?? "").trim();
    const uploaderName = String(request.data?.uploaderName ?? "").trim();
    const uploaderEmail = String(request.data?.uploaderEmail ?? "").trim();
    if (!title || !imageUrl) {
        throw new HttpsError("invalid-argument", "Title and imageUrl are required.");
    }
    const now = new Date().toISOString();
    const docRef = await db.collection("gallery").add({
        title,
        description,
        imageUrl,
        uploaderUid: request.auth.uid,
        uploaderName,
        uploaderEmail,
        order: Date.now(),
        createdAt: now,
        updatedAt: now,
    });
    return { id: docRef.id };
});
export const notifyPrivateChatRecipient = onDocumentCreated("privateChats/{chatId}/messages/{messageId}", async (event) => {
    const chatId = event.params.chatId;
    const messageId = event.params.messageId;
    const data = event.data?.data();
    const senderId = String(data?.senderId ?? "").trim();
    const recipientId = String(data?.recipientId ?? "").trim();
    if (!senderId || !recipientId || senderId === recipientId)
        return;
    const [senderSnap, recipientSnap] = await Promise.all([
        db.doc(`users/${senderId}`).get(),
        db.doc(`users/${recipientId}`).get(),
    ]);
    if (!recipientSnap.exists) {
        await logNotificationEvent({
            chatId,
            messageId,
            senderId,
            recipientId,
            status: "skipped",
            reason: "recipient_not_found",
        });
        return;
    }
    const sender = senderSnap.data() ??
        {};
    const recipient = recipientSnap.data() ?? {};
    const recipientEmail = String(recipient.email ?? "").trim();
    if (!recipientEmail) {
        await logNotificationEvent({
            chatId,
            messageId,
            senderId,
            recipientId,
            status: "skipped",
            reason: "recipient_missing_email",
        });
        return;
    }
    const presence = recipient.presence ?? {};
    const isOnline = Boolean(presence.isOnline);
    const lastActiveMs = toMillis(presence.lastActiveAt) || toMillis(presence.lastSeenAt);
    const inactiveForMs = Number.isFinite(lastActiveMs)
        ? Date.now() - lastActiveMs
        : Number.POSITIVE_INFINITY;
    if (isOnline && inactiveForMs < INACTIVE_THRESHOLD_MS) {
        await logNotificationEvent({
            chatId,
            messageId,
            senderId,
            recipientId,
            status: "skipped",
            reason: "recipient_active",
        });
        return;
    }
    const cooldownRef = db.doc(`privateChatNotifications/${recipientId}__${chatId}`);
    const cooldownSnap = await cooldownRef.get();
    const lastNotifiedAt = cooldownSnap.exists
        ? toMillis(cooldownSnap.data()?.lastNotifiedAt)
        : NaN;
    if (Number.isFinite(lastNotifiedAt) &&
        Date.now() - lastNotifiedAt < EMAIL_COOLDOWN_MS) {
        await logNotificationEvent({
            chatId,
            messageId,
            senderId,
            recipientId,
            status: "skipped",
            reason: "cooldown",
        });
        return;
    }
    const transporter = getEmailTransport();
    if (!transporter) {
        logger.warn("SMTP is not configured; skipping private chat email.");
        await logNotificationEvent({
            chatId,
            messageId,
            senderId,
            recipientId,
            status: "failed",
            reason: "smtp_not_configured",
        });
        return;
    }
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const appBaseUrl = process.env.APP_BASE_URL || "https://rahmanlab.example";
    const senderName = sender.name || "a collaborator";
    const recipientName = recipient.name || "Collaborator";
    try {
        await transporter.sendMail({
            from: fromEmail,
            to: recipientEmail,
            subject: `New private message from ${senderName}`,
            text: `Hello ${recipientName},\n\nYou received a new private message from ${senderName} on Rahman Lab.\n\nOpen chat: ${appBaseUrl}/chat\n\nFor privacy, message content is not included in this email.`,
            html: `<p>Hello ${recipientName},</p><p>You received a new private message from <strong>${senderName}</strong> on Rahman Lab.</p><p><a href="${appBaseUrl}/chat">Open private chat</a></p><p>For privacy, message content is not included in this email.</p>`,
        });
        await cooldownRef.set({
            recipientId,
            chatId,
            lastNotifiedAt: new Date().toISOString(),
            lastSenderId: senderId,
            status: "sent",
            lastAttemptAt: new Date().toISOString(),
            failureReason: null,
        }, { merge: true });
        await logNotificationEvent({
            chatId,
            messageId,
            senderId,
            recipientId,
            status: "sent",
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "send_failed";
        await cooldownRef.set({
            recipientId,
            chatId,
            status: "failed",
            lastAttemptAt: new Date().toISOString(),
            failureReason: errorMessage,
        }, { merge: true });
        await logNotificationEvent({
            chatId,
            messageId,
            senderId,
            recipientId,
            status: "failed",
            reason: errorMessage,
        });
        logger.error("private chat notification failed", {
            chatId,
            messageId,
            recipientId,
            error: errorMessage,
        });
    }
});
