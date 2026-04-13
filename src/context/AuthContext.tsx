import { deleteApp, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { generateChatKeyBundle } from "../chat/crypto";
import { upsertUserChatPublicKey } from "../chat/service";
import { auth, db } from "../firebase/config";
import type { User, UserRole } from "../types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  appUser: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createCollaboratorAccount: (
    email: string,
    password: string,
    name: string,
  ) => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const CHAT_KEY_STORAGE_PREFIX = "rl_chat_keybundle_v1_";
const ADMIN_EMAIL = "admin@rahmanlab.com";

const normalizeRole = (role: unknown): UserRole | null => {
  const value = String(role ?? "")
    .trim()
    .toLowerCase();
  if (value === "admin" || value === "collaborator" || value === "pending") {
    return value as UserRole;
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    let active = true;

    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        // If persistence cannot be set (browser policy), continue with SDK defaults.
      }

      if (!active) return;

      unsub = onAuthStateChanged(auth, async (fbUser) => {
        setLoading(true);
        // On hard refresh, some environments emit a transient null event
        // before restoring persisted auth. Give it a short grace window.
        let resolvedUser = fbUser;
        if (!resolvedUser) {
          const immediate = auth.currentUser;
          if (immediate) {
            resolvedUser = immediate;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 350));
            resolvedUser = auth.currentUser;
          }
        }

        setFirebaseUser(resolvedUser);
        if (resolvedUser) {
          const isSeededAdmin =
            (resolvedUser.email ?? "").trim().toLowerCase() === ADMIN_EMAIL;
          const normalizedEmail = (resolvedUser.email ?? "")
            .trim()
            .toLowerCase();

          const resolveCollaboratorByEmail = async () => {
            if (!normalizedEmail) return null;
            const collabByEmail = await getDocs(
              query(
                collection(db, "collaborators"),
                where("email", "==", normalizedEmail),
              ),
            );
            return collabByEmail.docs[0] ?? null;
          };

          const applyCollaborator = async (collabDoc: { data: () => any }) => {
            const collab = collabDoc.data() as {
              name?: string;
              email?: string;
              createdAt?: string;
            };

            await setDoc(
              doc(db, "users", resolvedUser.uid),
              {
                email: collab.email || resolvedUser.email || "",
                name: collab.name || resolvedUser.displayName || "User",
                role: "collaborator",
                createdAt: collab.createdAt || new Date().toISOString(),
              },
              { merge: true },
            );

            setAppUser({
              uid: resolvedUser.uid,
              email: collab.email || resolvedUser.email || "",
              name: collab.name || resolvedUser.displayName || "User",
              role: "collaborator",
              createdAt: collab.createdAt || new Date().toISOString(),
            });
          };

          const snap = await getDoc(doc(db, "users", resolvedUser.uid));
          if (snap.exists()) {
            const row = snap.data() as Partial<User>;
            const normalizedRole = normalizeRole(row.role);

            if (normalizedRole) {
              setAppUser({
                uid: resolvedUser.uid,
                email: row.email || resolvedUser.email || "",
                name: row.name || resolvedUser.displayName || "User",
                role: normalizedRole,
                createdAt: row.createdAt || new Date().toISOString(),
              });
            } else {
              const collabByUid = await getDocs(
                query(
                  collection(db, "collaborators"),
                  where("uid", "==", resolvedUser.uid),
                ),
              );
              const collabDoc = collabByUid.docs[0];
              if (collabDoc) {
                const collab = collabDoc.data() as {
                  name?: string;
                  email?: string;
                  createdAt?: string;
                };
                setAppUser({
                  uid: resolvedUser.uid,
                  email: row.email || collab.email || resolvedUser.email || "",
                  name:
                    row.name ||
                    collab.name ||
                    resolvedUser.displayName ||
                    "User",
                  role: "collaborator",
                  createdAt:
                    row.createdAt ||
                    collab.createdAt ||
                    new Date().toISOString(),
                });
              } else {
                const collabByEmailDoc = await resolveCollaboratorByEmail();
                if (collabByEmailDoc) {
                  await applyCollaborator(collabByEmailDoc);
                } else if (isSeededAdmin) {
                  setAppUser({
                    uid: resolvedUser.uid,
                    email: resolvedUser.email || ADMIN_EMAIL,
                    name: resolvedUser.displayName || "Admin Rahman",
                    role: "admin",
                    createdAt: new Date().toISOString(),
                  });
                } else {
                  setAppUser(null);
                }
              }
            }
          } else {
            if (isSeededAdmin) {
              setAppUser({
                uid: resolvedUser.uid,
                email: resolvedUser.email || ADMIN_EMAIL,
                name: resolvedUser.displayName || "Admin Rahman",
                role: "admin",
                createdAt: new Date().toISOString(),
              });
              setLoading(false);
              return;
            }

            const collabByUid = await getDocs(
              query(
                collection(db, "collaborators"),
                where("uid", "==", resolvedUser.uid),
              ),
            );

            const collabDoc = collabByUid.docs[0];
            if (collabDoc) {
              await applyCollaborator(collabDoc);
            } else {
              const collabByEmailDoc = await resolveCollaboratorByEmail();
              if (collabByEmailDoc) {
                await applyCollaborator(collabByEmailDoc);
              } else {
                setAppUser(null);
              }
            }
          }
        } else {
          setAppUser(null);
        }
        setLoading(false);
      });
    };

    initAuth().catch(() => {
      setLoading(false);
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const userRef = doc(db, "users", firebaseUser.uid);

    const writePresence = (isOnline: boolean) =>
      setDoc(
        userRef,
        {
          presence: {
            isOnline,
            lastActiveAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
          },
        },
        { merge: true },
      );

    const markOnline = () => {
      void writePresence(document.visibilityState === "visible");
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void writePresence(true);
      }
    }, 60_000);

    const onVisibilityChange = () => {
      void writePresence(document.visibilityState === "visible");
    };

    const onBeforeUnload = () => {
      void writePresence(false);
    };

    markOnline();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      void writePresence(false);
    };
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const ensureChatPublicKey = async () => {
      const storageKey = `${CHAT_KEY_STORAGE_PREFIX}${firebaseUser.uid}`;
      const raw = localStorage.getItem(storageKey);

      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { publicKeyJwk?: JsonWebKey };
          if (parsed.publicKeyJwk) {
            await upsertUserChatPublicKey(
              firebaseUser.uid,
              parsed.publicKeyJwk,
            );
            return;
          }
        } catch {
          localStorage.removeItem(storageKey);
        }
      }

      const generated = await generateChatKeyBundle();
      localStorage.setItem(storageKey, JSON.stringify(generated));
      await upsertUserChatPublicKey(firebaseUser.uid, generated.publicKeyJwk);
    };

    ensureChatPublicKey().catch(() => {
      // Chat key provisioning should not block auth session.
    });
  }, [firebaseUser?.uid]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setAppUser(null);
  };

  const createCollaboratorAccount = async (
    email: string,
    password: string,
    name: string,
  ): Promise<string> => {
    // Create isolated secondary app — admin session stays untouched
    const secondaryApp = initializeApp(firebaseConfig, "secondary");
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password,
      );

      // Firestore write uses main admin session (still intact)
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        name,
        role: "collaborator" as UserRole,
        createdAt: new Date().toISOString(),
      });

      return cred.user.uid;
    } finally {
      // Always clean up secondary app
      await deleteApp(secondaryApp);
    }
  };

  const role = appUser?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        role,
        loading,
        login,
        logout,
        createCollaboratorAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
