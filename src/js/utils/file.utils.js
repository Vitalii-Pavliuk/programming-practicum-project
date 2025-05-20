export class FileUtils {
    static async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    static saveToFile(data, filename, type = 'image/bmp') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'output.bmp';
        a.click();
        URL.revokeObjectURL(url);
    }

    static createFileInput(accept = '.bmp', onChange = null) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        if (onChange) {
            input.onchange = onChange;
        }
        return input;
    }
} 