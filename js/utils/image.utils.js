export class ImageUtils {
    static createImageData(width, height) {
        return new Uint8ClampedArray(width * height * 4);
    }

    static convertBGRtoRGBA(bgrData, width, height) {
        const rgbaData = this.createImageData(width, height);
        
        for (let i = 0; i < bgrData.length; i += 3) {
            const pixelIndex = (i / 3) * 4;
            rgbaData[pixelIndex] = bgrData[i + 2];     // R
            rgbaData[pixelIndex + 1] = bgrData[i + 1]; // G
            rgbaData[pixelIndex + 2] = bgrData[i];     // B
            rgbaData[pixelIndex + 3] = 255;            // A
        }
        
        return rgbaData;
    }

    static interpolateColors(color1, color2, factor) {
        return [
            Math.round(color1[0] + (color2[0] - color1[0]) * factor),
            Math.round(color1[1] + (color2[1] - color1[1]) * factor),
            Math.round(color1[2] + (color2[2] - color1[2]) * factor)
        ];
    }

    static getColorSchemes() {
        return {
            '1': [[255, 0, 0], [0, 0, 255]],    // Red to Blue
            '2': [[0, 255, 0], [255, 0, 255]],  // Green to Magenta
            '3': [[255, 255, 0], [0, 255, 255]], // Yellow to Cyan
            'default': [[0, 0, 0], [255, 255, 255]] // Black to White
        };
    }
} 