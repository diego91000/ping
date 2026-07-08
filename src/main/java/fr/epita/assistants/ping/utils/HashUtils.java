package fr.epita.assistants.ping.utils;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

public class HashUtils {

    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH = 128;

    private static SecretKey deriveKey(String password) throws Exception {
        byte[] hash = MessageDigest.getInstance("SHA-256")
                .digest(password.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(hash, "AES");
    }

    public static String encrypt(String password) throws Exception {
        String key = "Noximillienlhorloger";
        SecretKey secretKey = deriveKey(key);

        byte[] IV= new byte[IV_LENGTH];
        new SecureRandom().nextBytes(IV);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH, IV));
        byte[] cipherText = cipher.doFinal(password.getBytes(StandardCharsets.UTF_8));

        byte[] result = new byte[IV.length + cipherText.length];
        System.arraycopy(IV, 0, result, 0, IV.length);
        System.arraycopy(cipherText, 0, result, IV.length, cipherText.length);

        return Base64.getEncoder().encodeToString(result);
    }

    public static String decrypt(String encrypt_password) throws Exception {
        String key = "Noximillienlhorloger";
        SecretKey secretKey = deriveKey(key);
        byte[] data = Base64.getDecoder().decode(encrypt_password);

        byte[] iv = new byte[IV_LENGTH];
        byte[] cipherText = new byte[data.length - IV_LENGTH];
        System.arraycopy(data, 0, iv, 0, IV_LENGTH);
        System.arraycopy(data, IV_LENGTH, cipherText, 0, cipherText.length);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH, iv));
        byte[] plain = cipher.doFinal(cipherText);

        return new String(plain, StandardCharsets.UTF_8);
    }
}
