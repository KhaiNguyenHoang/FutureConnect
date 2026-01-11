
import { join } from "path";
import { mkdir } from "fs/promises";

// Magic Bytes signatures
const SIGNATURES: Record<string, number[]> = {
    // Images
    jpg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    gif: [0x47, 0x49, 0x46, 0x38],
    webp: [0x52, 0x49, 0x46, 0x46], // Starts with 'RIFF', different offset check usually needed but this is a basic check

    // Video
    mp4: [0x66, 0x74, 0x79, 0x70], // 'ftyp' usually at offset 4, handled in logic
    webm: [0x1A, 0x45, 0xDF, 0xA3],

    // Docs
    pdf: [0x25, 0x50, 0x44, 0x46],
};

const UPLOAD_DIR = join(import.meta.dir, "../../public/uploads");

// Ensure upload dir exists
await mkdir(UPLOAD_DIR, { recursive: true });

export const validateAndSaveFile = async (file: File) => {
    try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        // --- Magic Bytes Validation ---
        let isValid = false;
        let detectedType = "";

        // Check against signatures
        for (const [type, sig] of Object.entries(SIGNATURES)) {
            // Special handling for MP4 which has "ftyp" starting at 4th byte usually for some variants, 
            // but standard ISO base media file format often starts with 00 00 00 ... ftyp
            // For simplicity here we check common headers. 
            // MP4 is tricky, often best to check if bytes 4-8 are 'ftyp'.
            if (type === 'mp4') {
                if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
                    isValid = true;
                    detectedType = type;
                    break;
                }
            } else if (bytes.length >= sig.length) {
                let match = true;
                for (let i = 0; i < sig.length; i++) {
                    if (bytes[i] !== sig[i]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    isValid = true;
                    detectedType = type;
                    break;
                }
            }
        }

        // Basic Text check (heuristic: mostly printable ASCII/UTF8) if not binary media
        // For now, let's strictly allow only the media types defined above + safe text if needed.
        // User asked for deny dangerous, so whitelist approach is best.

        if (!isValid) {
            throw new Error("Invalid file type or corrupted file (Magic bytes mismatch)");
        }

        // --- Save File ---
        const fileName = `${crypto.randomUUID()}.${detectedType}`;
        const filePath = join(UPLOAD_DIR, fileName);

        await Bun.write(filePath, buffer);

        return {
            filename: fileName,
            path: `/uploads/${fileName}`,
            type: detectedType,
            size: file.size
        };

    } catch (error) {
        console.error("Upload Error:", error);
        throw error;
    }
};
