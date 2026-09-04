/**
 * KafChat Real-time End-to-End Encryption (E2EE) Engine
 * Cryptographic Standard: ECDH (P-256) Key Exchange + AES-GCM (256-bit) Encryption
 */

const DB_NAME = "KafChat_Crypto_Vault";
const STORE_NAME = "KeyStore";

// Helper to check if SubtleCrypto is available (Requires HTTPS or Localhost)
const isSubtleCryptoSupported = () => {
  return typeof window !== "undefined" && window.crypto && !!window.crypto.subtle;
};

const openCryptoDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB is not supported"));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const storePrivateKey = async (userId, privateKey) => {
  try {
    const db = await openCryptoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(privateKey, `priv_key_${userId}`);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("Could not store private key in IndexedDB:", err.message);
  }
};

const getPrivateKey = async (userId) => {
  try {
    const db = await openCryptoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(`priv_key_${userId}`);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
};

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  const binary_string = window.atob(base64);
  const bytes = new Uint8Array(binary_string.length);
  for (let i = 0; i < binary_string.length; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

export const initUserE2EEKeys = async (userId) => {
  if (!userId) return null;

  // Safe check for HTTP Network IP / Non-Secure Context
  if (!isSubtleCryptoSupported()) {
    console.warn("⚠️ Web Crypto Subtle is disabled on HTTP Network IP. Skipping local E2EE keygen.");
    return null;
  }

  try {
    const existingPrivKey = await getPrivateKey(userId);
    if (existingPrivKey) {
      const savedPublicKey = localStorage.getItem(`kaf_pub_key_${userId}`);
      if (savedPublicKey) return savedPublicKey;
    }

    const keyPair = await window.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    );

    await storePrivateKey(userId, keyPair.privateKey);
    const exportedPub = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const pubBase64 = arrayBufferToBase64(exportedPub);

    localStorage.setItem(`kaf_pub_key_${userId}`, pubBase64);
    return pubBase64;
  } catch (err) {
    console.warn("E2EE Key Generation bypassed:", err.message);
    return null;
  }
};

const deriveSharedKey = async (myPrivateKey, peerPublicKeyBase64) => {
  if (!isSubtleCryptoSupported() || !myPrivateKey || !peerPublicKeyBase64) return null;
  try {
    const peerKeyBuffer = base64ToArrayBuffer(peerPublicKeyBase64);
    const peerPublicKey = await window.crypto.subtle.importKey(
      "spki",
      peerKeyBuffer,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );

    return await window.crypto.subtle.deriveKey(
      { name: "ECDH", public: peerPublicKey },
      myPrivateKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  } catch (err) {
    console.warn("Derive shared key bypassed:", err.message);
    return null;
  }
};

export const encryptMessage = async (text, myUserId, peerPublicKey) => {
  if (!peerPublicKey || !text || !isSubtleCryptoSupported()) return text;
  try {
    const myPrivateKey = await getPrivateKey(myUserId);
    if (!myPrivateKey) return text;

    const aesKey = await deriveSharedKey(myPrivateKey, peerPublicKey);
    if (!aesKey) return text;

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encodedText
    );

    return {
      ciphertext: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(iv),
      isEncrypted: true,
    };
  } catch (err) {
    console.error("Encryption Error:", err);
    return text;
  }
};

export const decryptMessage = async (ciphertext, ivBase64, myUserId, peerPublicKey) => {
  if (!ciphertext || !ivBase64 || !peerPublicKey || !isSubtleCryptoSupported()) return ciphertext;
  try {
    const myPrivateKey = await getPrivateKey(myUserId);
    if (!myPrivateKey) return ciphertext;

    const aesKey = await deriveSharedKey(myPrivateKey, peerPublicKey);
    if (!aesKey) return ciphertext;

    const iv = base64ToArrayBuffer(ivBase64);
    const cipherBuffer = base64ToArrayBuffer(ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      aesKey,
      cipherBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error("Decryption Error:", err);
    return "🔒 [Encrypted Message]";
  }
};