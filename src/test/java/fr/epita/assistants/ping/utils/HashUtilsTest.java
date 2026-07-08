package fr.epita.assistants.ping.utils;
import org.junit.jupiter.api.Test;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class HashUtilsTest {
    @Test
    void encryptThenDecrypt_returnsTheOriginalValue() throws Exception {
        String plain = "myS3cretP@ssword";
        String encrypted = HashUtils.encrypt(plain);
        assertThat(HashUtils.decrypt(encrypted)).isEqualTo(plain);

    }
    @Test
    void encrypt_doesNotReturnThePlaintext() throws Exception {
        String plain = "password123";
        assertThat(HashUtils.encrypt(plain)).isNotEqualTo(plain);
    }
    @Test
    void encrypt_producesValidBase64() throws Exception {
        String encrypted = HashUtils.encrypt("hello");
        assertThat(Base64.getDecoder().decode(encrypted)).isNotEmpty();
    }
    @Test
    void encrypt_isRandomized_sameInputGivesDifferentCiphertexts() throws Exception {
        String plain = "samePassword";
        String first = HashUtils.encrypt(plain);
        String second = HashUtils.encrypt(plain);
        assertThat(first).isNotEqualTo(second);
        assertThat(HashUtils.decrypt(first)).isEqualTo(plain);
        assertThat(HashUtils.decrypt(second)).isEqualTo(plain);
    }
    @Test
    void decrypt_onBadCiphertext_throws() throws Exception {
        String encrypted = HashUtils.encrypt("hello");
        byte[] raw = Base64.getDecoder().decode(encrypted);
        raw[raw.length - 1] ^= 0x01;
        String bad = Base64.getEncoder().encodeToString(raw);
        assertThatThrownBy(() -> HashUtils.decrypt(bad)).isInstanceOf(Exception.class);
    }
    @Test
    void decrypr_onInvalidBase64_throws() {
        assertThatThrownBy(()-> HashUtils.decrypt("base is incorrect")).isInstanceOf(Exception.class);
    }
}
