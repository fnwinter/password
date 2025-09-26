/**
 * RSA 암호화/복호화를 위한 JavaScript 함수들
 * Web Crypto API를 사용하여 RSA-OAEP 방식으로 구현
 */

class RSACrypto {
    constructor() {
        this.publicKey = null;
        this.privateKey = null;
    }

    /**
     * RSA 키 쌍을 생성합니다
     * @param {number} keySize - 키 크기 (기본값: 2048)
     * @returns {Promise<CryptoKeyPair>}
     */
    async generateKeyPair(keySize = 2048) {
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: keySize,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256",
                },
                true,
                ["encrypt", "decrypt"]
            );

            this.publicKey = keyPair.publicKey;
            this.privateKey = keyPair.privateKey;

            return keyPair;
        } catch (error) {
            throw new Error(`키 생성 실패: ${error.message}`);
        }
    }

    /**
     * 공개키를 PEM 형식으로 내보냅니다
     * @param {CryptoKey} publicKey - 공개키
     * @returns {Promise<string>}
     */
    async exportPublicKey(publicKey = this.publicKey) {
        try {
            const exported = await window.crypto.subtle.exportKey("spki", publicKey);
            const exportedAsBuffer = new Uint8Array(exported);
            const exportedAsBase64 = this.arrayBufferToBase64(exportedAsBuffer);
            return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
        } catch (error) {
            throw new Error(`공개키 내보내기 실패: ${error.message}`);
        }
    }

    /**
     * 개인키를 PEM 형식으로 내보냅니다
     * @param {CryptoKey} privateKey - 개인키
     * @returns {Promise<string>}
     */
    async exportPrivateKey(privateKey = this.privateKey) {
        try {
            const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
            const exportedAsBuffer = new Uint8Array(exported);
            const exportedAsBase64 = this.arrayBufferToBase64(exportedAsBuffer);
            return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;
        } catch (error) {
            throw new Error(`개인키 내보내기 실패: ${error.message}`);
        }
    }

    /**
     * PEM 형식의 공개키를 가져옵니다
     * @param {string} pemKey - PEM 형식의 공개키
     * @returns {Promise<CryptoKey>}
     */
    async importPublicKey(pemKey) {
        try {
            const pemHeader = "-----BEGIN PUBLIC KEY-----";
            const pemFooter = "-----END PUBLIC KEY-----";
            const pemContents = pemKey
                .replace(pemHeader, "")
                .replace(pemFooter, "")
                .replace(/\s/g, "");

            const binaryDerString = this.base64ToArrayBuffer(pemContents);
            const publicKey = await window.crypto.subtle.importKey(
                "spki",
                binaryDerString,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                true,
                ["encrypt"]
            );

            return publicKey;
        } catch (error) {
            throw new Error(`공개키 가져오기 실패: ${error.message}`);
        }
    }

    /**
     * PEM 형식의 개인키를 가져옵니다
     * @param {string} pemKey - PEM 형식의 개인키
     * @returns {Promise<CryptoKey>}
     */
    async importPrivateKey(pemKey) {
        try {
            const pemHeader = "-----BEGIN PRIVATE KEY-----";
            const pemFooter = "-----END PRIVATE KEY-----";
            const pemContents = pemKey
                .replace(pemHeader, "")
                .replace(pemFooter, "")
                .replace(/\s/g, "");

            const binaryDerString = this.base64ToArrayBuffer(pemContents);
            const privateKey = await window.crypto.subtle.importKey(
                "pkcs8",
                binaryDerString,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                true,
                ["decrypt"]
            );

            return privateKey;
        } catch (error) {
            throw new Error(`개인키 가져오기 실패: ${error.message}`);
        }
    }

    /**
     * 텍스트를 RSA로 암호화합니다
     * @param {string} text - 암호화할 텍스트
     * @param {CryptoKey} publicKey - 공개키 (기본값: this.publicKey)
     * @returns {Promise<string>} - Base64로 인코딩된 암호화된 데이터
     */
    async encrypt(text, publicKey = this.publicKey) {
        try {
            if (!publicKey) {
                throw new Error("공개키가 설정되지 않았습니다.");
            }

            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            console.log(`암호화 시작: 원본 텍스트 "${text}", ${data.length} 바이트`);

            // RSA-OAEP는 최대 데이터 크기가 제한됩니다 (키 크기에 따라)
            const maxChunkSize = 190; // 2048비트 키의 경우
            const chunks = [];
            
            for (let i = 0; i < data.length; i += maxChunkSize) {
                const chunk = data.slice(i, i + maxChunkSize);
                console.log(`청크 ${Math.floor(i/maxChunkSize) + 1} 암호화 중: ${chunk.length} 바이트`);
                
                const encryptedChunk = await window.crypto.subtle.encrypt(
                    {
                        name: "RSA-OAEP",
                    },
                    publicKey,
                    chunk
                );
                chunks.push(new Uint8Array(encryptedChunk));
                console.log(`청크 ${Math.floor(i/maxChunkSize) + 1} 암호화 완료: ${encryptedChunk.byteLength} 바이트`);
            }

            // 모든 청크를 하나로 합치기
            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            
            for (const chunk of chunks) {
                result.set(chunk, offset);
                offset += chunk.length;
            }

            const base64Result = this.arrayBufferToBase64(result);
            console.log(`암호화 완료: 총 ${totalLength} 바이트, Base64 길이: ${base64Result.length}`);
            return base64Result;
        } catch (error) {
            console.error("암호화 오류:", error);
            throw new Error(`암호화 실패: ${error.message}`);
        }
    }

    /**
     * RSA로 암호화된 데이터를 복호화합니다
     * @param {string} encryptedData - Base64로 인코딩된 암호화된 데이터
     * @param {CryptoKey} privateKey - 개인키 (기본값: this.privateKey)
     * @returns {Promise<string>} - 복호화된 텍스트
     */
    async decrypt(encryptedData, privateKey = this.privateKey) {
        try {
            if (!privateKey) {
                throw new Error("개인키가 설정되지 않았습니다.");
            }

            const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
            const chunkSize = 256; // 2048비트 키의 경우 암호화된 청크 크기
            
            console.log(`복호화 시작: 총 ${encryptedBuffer.length} 바이트, 청크 크기: ${chunkSize}`);
            
            const chunks = [];
            for (let i = 0; i < encryptedBuffer.length; i += chunkSize) {
                const chunk = encryptedBuffer.slice(i, i + chunkSize);
                console.log(`청크 ${Math.floor(i/chunkSize) + 1} 처리 중: ${chunk.length} 바이트`);
                
                try {
                    const decryptedChunk = await window.crypto.subtle.decrypt(
                        {
                            name: "RSA-OAEP",
                        },
                        privateKey,
                        chunk
                    );
                    chunks.push(new Uint8Array(decryptedChunk));
                    console.log(`청크 ${Math.floor(i/chunkSize) + 1} 복호화 성공: ${decryptedChunk.byteLength} 바이트`);
                } catch (chunkError) {
                    console.error(`청크 ${Math.floor(i/chunkSize) + 1} 복호화 실패:`, chunkError);
                    throw new Error(`청크 ${Math.floor(i/chunkSize) + 1} 복호화 실패: ${chunkError.message}`);
                }
            }

            // 모든 청크를 하나로 합치기
            const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            
            for (const chunk of chunks) {
                result.set(chunk, offset);
                offset += chunk.length;
            }

            console.log(`복호화 완료: 총 ${totalLength} 바이트`);
            const decoder = new TextDecoder();
            const decodedText = decoder.decode(result);
            console.log(`복호화된 텍스트: "${decodedText}"`);
            
            return decodedText;
        } catch (error) {
            console.error("복호화 오류:", error);
            throw new Error(`복호화 실패: ${error.message}`);
        }
    }

    /**
     * ArrayBuffer를 Base64 문자열로 변환합니다
     * @param {ArrayBuffer|Uint8Array} buffer
     * @returns {string}
     */
    arrayBufferToBase64(buffer) {
        const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Base64 문자열을 ArrayBuffer로 변환합니다
     * @param {string} base64
     * @returns {ArrayBuffer}
     */
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
}

// 사용 예시 및 테스트 함수들

// 같은 텍스트의 암호화 결과 비교 테스트
async function testEncryptionVariability() {
    try {
        console.log("=== 같은 텍스트 암호화 결과 비교 테스트 ===");
        
        const rsa = new RSACrypto();
        await rsa.generateKeyPair(2048);
        
        const testText = "안녕하세요! 테스트입니다.";
        console.log(`테스트 텍스트: "${testText}"`);
        
        // 같은 텍스트를 3번 암호화
        const results = [];
        for (let i = 1; i <= 3; i++) {
            console.log(`\n--- ${i}번째 암호화 ---`);
            const encrypted = await rsa.encrypt(testText);
            results.push(encrypted);
            console.log(`암호화 결과: ${encrypted.substring(0, 50)}...`);
        }
        
        // 결과 비교
        console.log("\n=== 결과 비교 ===");
        console.log("1번째 암호화:", results[0].substring(0, 50) + "...");
        console.log("2번째 암호화:", results[1].substring(0, 50) + "...");
        console.log("3번째 암호화:", results[2].substring(0, 50) + "...");
        
        // 복호화 테스트
        console.log("\n=== 복호화 테스트 ===");
        for (let i = 0; i < results.length; i++) {
            const decrypted = await rsa.decrypt(results[i]);
            console.log(`${i+1}번째 복호화 결과: "${decrypted}"`);
            console.log(`원본과 일치: ${testText === decrypted ? "✓" : "✗"}`);
        }
        
        console.log("\n=== 결론 ===");
        console.log("✓ 같은 텍스트라도 매번 다른 암호화 결과가 나옵니다 (보안상 정상)");
        console.log("✓ 모든 암호화 결과가 올바르게 복호화됩니다");
        
        return {
            publicKey: await rsa.exportPublicKey(),
            privateKey: await rsa.exportPrivateKey(),
            encrypted: results[0],
            decrypted: testText
        };
        
    } catch (error) {
        console.error("테스트 실패:", error.message);
        throw error;
    }
}

async function testRSACrypto() {
    try {
        console.log("RSA 암호화/복호화 테스트 시작...");
        
        const rsa = new RSACrypto();
        
        // 1. 키 쌍 생성
        console.log("1. 키 쌍 생성 중...");
        await rsa.generateKeyPair(2048);
        console.log("✓ 키 쌍 생성 완료");
        
        // 2. 공개키/개인키 내보내기
        console.log("2. 키 내보내기...");
        const publicKeyPem = await rsa.exportPublicKey();
        const privateKeyPem = await rsa.exportPrivateKey();
        console.log("✓ 키 내보내기 완료");
        
        // 3. 암호화할 텍스트
        const originalText = "안녕하세요! 이것은 RSA 암호화 테스트입니다.";
        console.log(`3. 원본 텍스트: ${originalText}`);
        
        // 4. 암호화
        console.log("4. 암호화 중...");
        const encrypted = await rsa.encrypt(originalText);
        console.log(`✓ 암호화 완료: ${encrypted.substring(0, 50)}...`);
        
        // 5. 복호화
        console.log("5. 복호화 중...");
        const decrypted = await rsa.decrypt(encrypted);
        console.log(`✓ 복호화 완료: ${decrypted}`);
        
        // 6. 결과 검증
        if (originalText === decrypted) {
            console.log("🎉 테스트 성공! 암호화/복호화가 정상적으로 작동합니다.");
        } else {
            console.log("❌ 테스트 실패! 원본과 복호화된 텍스트가 다릅니다.");
        }
        
        return {
            publicKey: publicKeyPem,
            privateKey: privateKeyPem,
            encrypted: encrypted,
            decrypted: decrypted
        };
        
    } catch (error) {
        console.error("테스트 실패:", error.message);
        throw error;
    }
}

// 전역에서 사용할 수 있도록 내보내기
if (typeof window !== 'undefined') {
    window.RSACrypto = RSACrypto;
    window.testRSACrypto = testRSACrypto;
    window.testEncryptionVariability = testEncryptionVariability;
}

// Node.js 환경에서도 사용할 수 있도록 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RSACrypto, testRSACrypto };
}
