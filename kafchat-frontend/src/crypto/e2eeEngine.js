// Pure Web Crypto API: ECDH (Curve25519 / P-256) + AES-GCM 256-bit

const DB_KEY_STORAGE = "kafchat_e2ee_keypair";

// Helper check for subtle crypto availability (Only on HTTPS or Localhost)
const isSubtleCryptoSupported = () => {
  return typeof window !== "undefined" && window.crypto && !!window.crypto.subtle;
};

// 1. ArrayBuffer / Base64 Conversion Helpers
export const bufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const base64ToBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// 2. Initialize or Retrieve Local Keypair
export const getOrGenerateKeyPair = async () => {
  try {
    if (!isSubtleCryptoSupported()) {
      console.warn("⚠️ Web Crypto Subtle is disabled on HTTP Network IP. Skipping local E2EE keygen.");
      return null;
    }

    const existing = localStorage.getItem(DB_KEY_STORAGE);
    if (existing) {
      return JSON.parse(existing);
    }

    // Generate ECDH Keypair for key agreement
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveKey", "deriveBits"]
    );

    const exportedPublic = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    const keys = {
      publicKeyBase64: bufferToBase64(exportedPublic),
      privateKeyBase64: bufferToBase64(exportedPrivate),
    };

    localStorage.setItem(DB_KEY_STORAGE, JSON.stringify(keys));
    return keys;
  } catch (error) {
    console.warn("E2EE Key Generation bypassed:", error.message);
    return null;
  }
};

// 3. Derive Shared Symmetric Key (Sender Private + Receiver Public)
export const deriveSharedKey = async (privateKeyBase64, recipientPublicKeyBase64) => {
  try {
    if (!isSubtleCryptoSupported() || !privateKeyBase64 || !recipientPublicKeyBase64) {
      return null;
    }

    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      base64ToBuffer(privateKeyBase64),
      { name: "ECDH", namedCurve: "P-256" },
      false,
      ["deriveKey"]
    );

    const recipientPublicKey = await window.crypto.subtle.importKey(
      "spki",
      base64ToBuffer(recipientPublicKeyBase64),
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );

    return await window.crypto.subtle.deriveKey(
      { name: "ECDH", public: recipientPublicKey },
      privateKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.warn("Shared Key Derivation bypassed:", error.message);
    return null;
  }
};

// 4. Encrypt Plaintext Payload with AES-GCM
export const encryptMessagePayload = async (sharedKey, plaintext) => {
  try {
    if (!isSubtleCryptoSupported() || !sharedKey) {
      return { encryptedContent: plaintext, iv: null };
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(plaintext);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      sharedKey,
      encodedText
    );

    return {
      encryptedContent: bufferToBase64(ciphertextBuffer),
      iv: bufferToBase64(iv),
    };
  } catch (error) {
    console.error("Payload Encryption Error:", error);
    return { encryptedContent: plaintext, iv: null };
  }
};

// 5. Decrypt Ciphertext Payload
export const decryptMessagePayload = async (sharedKey, encryptedContentBase64, ivBase64) => {
  try {
    if (!isSubtleCryptoSupported() || !sharedKey || !ivBase64) {
      return encryptedContentBase64;
    }

    const ciphertext = base64ToBuffer(encryptedContentBase64);
    const iv = base64ToBuffer(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      sharedKey,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    return encryptedContentBase64 || "[Encrypted Message]";
  }
};