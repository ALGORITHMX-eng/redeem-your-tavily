import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY =
  "BD-e2f_MCbmgqy-619-_pVKOKwAUUMRIhCI4riTQbQj3kC8RZ1Jk5lGKEHtV0dYNYZQVfMCvDA_w3qgob4GOYos";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer | null) => {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

export const enablePushNotifications = async (): Promise<{ ok: boolean; message: string }> => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, message: "Push notifications are not supported in this browser." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, message: "Notification permission was not granted." };
  }

  const registration =
    (await navigator.serviceWorker.getRegistration("/sw.js")) ||
    (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  const endpoint = subscription.endpoint;
  const p256dh = json.keys?.p256dh ?? arrayBufferToBase64(subscription.getKey("p256dh"));
  const auth = json.keys?.auth ?? arrayBufferToBase64(subscription.getKey("auth"));

  const { error } = await supabase
    .from("push_subscriptions")
    .insert({ endpoint, p256dh, auth, user_agent: navigator.userAgent });

  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Notifications enabled." };
};
