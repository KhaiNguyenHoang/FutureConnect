
import { describe, expect, it } from "bun:test";
import { validateAndSaveFile } from "../src/service/upload.service";

describe("Upload Service", () => {
    // Mock a valid PNG file
    const validPngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
    const validPngFile = new File([validPngBytes], "test.png", { type: "image/png" });

    // Mock a malicious file (e.g., script renamed to png)
    const maliciousBytes = new Uint8Array([0x23, 0x21, 0x2F, 0x62, 0x69, 0x6E, 0x2F, 0x62, 0x61, 0x73, 0x68]); // "#!/bin/bash"
    const maliciousFile = new File([maliciousBytes], "evil.png", { type: "image/png" });

    it("should accept valid PNG file", async () => {
        const result = await validateAndSaveFile(validPngFile);
        expect(result.filename).toBeDefined();
        expect(result.type).toBe("png");
        expect(result.path).toStartWith("/uploads/");
    });

    it("should reject invalid file with wrong magic bytes", async () => {
        try {
            await validateAndSaveFile(maliciousFile);
            expect(true).toBe(false); // Should not reach here
        } catch (error: any) {
            expect(error.message).toContain("Invalid file type");
        }
    });
});
