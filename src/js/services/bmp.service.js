import { FileUtils } from '../utils/file.utils.js';
import { ImageUtils } from '../utils/image.utils.js';

export class BMPService {
    constructor() {
        this.fileData = null;
        this.width = 0;
        this.height = 0;
        this.imageData = null;
    }

    async loadBMPFile(file) {
        const arrayBuffer = await FileUtils.readFile(file);
        this.fileData = new Uint8Array(arrayBuffer);
        this.parseBMPHeader();
    }

    parseBMPHeader() {
        if (this.fileData[0] !== 0x42 || this.fileData[1] !== 0x4D) {
            throw new Error('Not a valid BMP file');
        }

        this.width = this.readInt32(18);
        this.height = this.readInt32(22);
        const pixelOffset = this.readInt32(10);
        this.imageData = this.fileData.slice(pixelOffset);
    }

    readInt32(offset) {
        return this.fileData[offset] |
            (this.fileData[offset + 1] << 8) |
            (this.fileData[offset + 2] << 16) |
            (this.fileData[offset + 3] << 24);
    }

    createNewImage(pattern, colorScheme) {
        const headerSize = 54;
        const pixelDataSize = this.width * this.height * 3;
        const newFileData = new Uint8Array(headerSize + pixelDataSize);

        newFileData.set(this.fileData.slice(0, headerSize));

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const offset = (y * this.width + x) * 3;
                const [r, g, b] = this.getPixelColor(x, y, pattern, colorScheme);
                newFileData[headerSize + offset] = b;
                newFileData[headerSize + offset + 1] = g;
                newFileData[headerSize + offset + 2] = r;
            }
        }

        return newFileData;
    }

    getPixelColor(x, y, pattern, colorScheme) {
        const colors = ImageUtils.getColorSchemes()[colorScheme] || ImageUtils.getColorSchemes().default;
        
        switch (pattern) {
            case '1': // Diagonal stripes pattern
                const diagonalPos = (x + y) % 60;
                const stripeWidth = 30;
                const factor = diagonalPos < stripeWidth ? diagonalPos / stripeWidth : (60 - diagonalPos) / stripeWidth;
                return ImageUtils.interpolateColors(colors[0], colors[1], factor);

            case '2': // Checkerboard pattern
                const squareSize = 20;
                const isEvenX = Math.floor(x / squareSize) % 2 === 0;
                const isEvenY = Math.floor(y / squareSize) % 2 === 0;
                return isEvenX === isEvenY ? colors[0] : colors[1];

            case '3': // Radial waves
                const angle = Math.atan2(y - this.height / 2, x - this.width / 2);
                const waves = 8;
                const wave = (Math.sin(angle * waves) + 1) / 2;
                return ImageUtils.interpolateColors(colors[0], colors[1], wave);

            default:
                return [0, 0, 0];
        }
    }

    hideMessage(message, imageData) {
        const data = new Uint8Array(imageData);
        const messageBytes = new TextEncoder().encode(message);
        
        const length = messageBytes.length;
        for (let i = 0; i < 32; i++) {
            const offset = 54 + i;
            const bit = (length >> i) & 1;
            data[offset] = (data[offset] & 0xFE) | bit;
        }

        for (let i = 0; i < messageBytes.length; i++) {
            for (let bit = 0; bit < 8; bit++) {
                const offset = 54 + 32 + i * 8 + bit;
                const messageBit = (messageBytes[i] >> bit) & 1;
                data[offset] = (data[offset] & 0xFE) | messageBit;
            }
        }

        return data;
    }

    extractMessage(imageData) {
        const data = new Uint8Array(imageData);
        
        let messageLength = 0;
        for (let i = 0; i < 32; i++) {
            const bit = data[54 + i] & 1;
            messageLength |= bit << i;
        }

        if (messageLength <= 0 || messageLength > (data.length - 54 - 32) / 8) {
            throw new Error('Invalid message length or no message found');
        }

        const messageBytes = new Uint8Array(messageLength);
        for (let i = 0; i < messageLength; i++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const offset = 54 + 32 + i * 8 + bit;
                const extractedBit = data[offset] & 1;
                byte |= extractedBit << bit;
            }
            messageBytes[i] = byte;
        }

        return new TextDecoder().decode(messageBytes);
    }

    saveToFile(data, filename) {
        FileUtils.saveToFile(data, filename);
    }
}

export const bmpService = new BMPService(); 