import { authService } from './services/auth.service.js';
import { bmpService } from './services/bmp.service.js';
import { FileUtils } from './utils/file.utils.js';
import { ImageUtils } from './utils/image.utils.js';

class App {
    constructor() {
        this.currentFile = null;
        this.setupAuthListeners();
        this.setupUIElements();
    }

    setupAuthListeners() {
        authService.setAuthStateChangeListener((user) => {
            document.getElementById('auth-container').classList.toggle('hidden', !!user);
            document.getElementById('main-container').classList.toggle('hidden', !user);
            if (user) {
                document.getElementById('user-info').textContent = `User: ${user}`;
                this.updateHistory();
                
                const history = authService.getUserHistory();
                if (history && history.patterns.length > 0) {
                    const lastPattern = history.patterns[0];
                    this.loadHistoryPattern(lastPattern);
                }
                
                if (history && history.files.length > 0) {
                    const lastFile = history.files[0];
                    document.getElementById('last-file').textContent = `Last file: ${lastFile}`;
                }
            }
        });
    }

    setupUIElements() {

        document.getElementById('login-btn').onclick = () => this.login();
        document.getElementById('logout-btn').onclick = () => this.logout();
        document.getElementById('open-file-btn').onclick = () => this.openBMPFile();
        document.getElementById('process-btn').onclick = () => this.processImage();
        document.getElementById('hide-msg-btn').onclick = () => this.hideMessage();
        document.getElementById('extract-msg-btn').onclick = () => this.extractMessage();

        document.getElementById('help-btn').onclick = () => this.showHelp();
        document.getElementById('about-btn').onclick = () => this.showAbout();
        document.getElementById('authors-btn').onclick = () => this.showAuthors();
    }

    async openBMPFile() {
        const input = FileUtils.createFileInput('.bmp', async (e) => {
            const file = e.target.files[0];
            if (file) {
                this.currentFile = file;
                await bmpService.loadBMPFile(file);
                authService.addToHistory('files', file.name);
                this.displayPreview();
            }
        });
        input.click();
    }

    displayPreview(imageData = null) {
        const canvas = document.getElementById('preview');
        const ctx = canvas.getContext('2d');
        
        const sourceData = imageData || bmpService.imageData;
        const width = imageData ? bmpService.width : bmpService.width;
        const height = imageData ? bmpService.height : bmpService.height;
        
        canvas.width = width;
        canvas.height = height;
        
        const rgbaData = ImageUtils.convertBGRtoRGBA(
            sourceData,
            width,
            height
        );
        
        const canvasImageData = new ImageData(rgbaData, width, height);
        ctx.putImageData(canvasImageData, 0, 0);
    }

    processImage() {
        if (!this.currentFile) {
            alert('Please open a BMP file first');
            return;
        }

        const pattern = document.getElementById('processType').value;
        const colorScheme = document.getElementById('colorScheme').value;

        authService.addToHistory('patterns', `Pattern ${pattern} with Color Scheme ${colorScheme}`);

        const newImageData = bmpService.createNewImage(pattern, colorScheme);
        
        this.displayPreview(newImageData.slice(54));
        
        const timestamp = new Date().getTime().toString().slice(-6);
        const newFileName = `p${pattern}_${timestamp}.bmp`;
        
        bmpService.saveToFile(newImageData, newFileName);
    }

    hideMessage() {
        if (!this.currentFile) {
            alert('Please open a BMP file first');
            return;
        }

        const message = document.getElementById('message').value;
        if (!message) {
            alert('Please enter a message to hide');
            return;
        }

        authService.addToHistory('hiddenMessages', message);

        const pattern = document.getElementById('processType').value;
        const colorScheme = document.getElementById('colorScheme').value;
        
        const processedImageData = bmpService.createNewImage(pattern, colorScheme);
        
        const newImageData = bmpService.hideMessage(message, processedImageData);
        
        this.displayPreview(newImageData.slice(54));
        
        const timestamp = new Date().getTime().toString().slice(-6);
        const newFileName = `hidden_${pattern}_${timestamp}.bmp`;
        
        bmpService.saveToFile(newImageData, newFileName);
    }

    extractMessage() {
        if (!this.currentFile) {
            alert('Please open a BMP file first');
            return;
        }

        try {
            const message = bmpService.extractMessage(bmpService.fileData);
            document.getElementById('extracted-message').textContent = message;
            authService.addToHistory('extractedMessages', message);
        } catch (error) {
            alert('No hidden message found or file is corrupted');
        }
    }

    updateHistory() {
        const history = authService.getUserHistory();
        if (!history) return;

        const escapeHtml = (text) => {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };

        const filesList = document.getElementById('files-list');
        filesList.innerHTML = history.files.map(file => 
            `<li onclick="app.loadHistoryFile('${escapeHtml(file)}')">${escapeHtml(file)}</li>`
        ).join('');

        const patternsList = document.getElementById('patterns-list');
        patternsList.innerHTML = history.patterns.map(pattern => 
            `<li onclick="app.loadHistoryPattern('${escapeHtml(pattern)}')">${escapeHtml(pattern)}</li>`
        ).join('');

        const messagesList = document.getElementById('messages-list');
        messagesList.innerHTML = [
            ...history.hiddenMessages.map(msg => 
                `<li class="hidden-message">${escapeHtml(msg)}</li>`
            ),
            ...history.extractedMessages.map(msg => 
                `<li class="extracted-message">${escapeHtml(msg)}</li>`
            )
        ].join('');
    }

    loadHistoryFile(filename) {
        this.openBMPFile();
    }

    loadHistoryPattern(pattern) {
        const match = pattern.match(/Pattern (\d+) with Color Scheme (\d+)/);
        if (match && match.length >= 3) {
            const patternNum = match[1];
            const colorSchemeNum = match[2];
            document.getElementById('processType').value = patternNum;
            document.getElementById('colorScheme').value = colorSchemeNum;
        }
    }

    login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!authService.users[username]) {
            if (authService.register(username, password)) {
                authService.login(username, password);
            } else {
                alert('Registration failed');
            }
        } else {
            if (!authService.login(username, password)) {
                alert('Invalid password');
            }
        }
    }

    logout() {
        authService.logout();
    }

    showHelp() {
        alert(`
Керівництво користувача:

1. Робота з файлами:
   - Натисніть "Відкрити BMP файл" для вибору 24-бітного BMP зображення
   - Зображення буде відображено в області попереднього перегляду
   - Ви можете відкрити новий файл в будь-який час

2. Обробка зображення:
   - Виберіть один з трьох патернів:
     * Патерн 1 - Діагональні смуги
     * Патерн 2 - Шаховий
     * Патерн 3 - Радіальні хвилі
   - Виберіть кольорову схему:
     * Від червоного до синього
     * Від зеленого до пурпурного
     * Від жовтого до бірюзового
   - Натисніть "Обробити зображення" для створення та збереження нового зображення

3. Стеганографія:
   - Для приховування повідомлення:
     * Введіть текст у поле повідомлення
     * Натисніть "Приховати повідомлення"
   - Для витягнення повідомлення:
     * Відкрийте зображення з прихованим повідомленням
     * Натисніть "Витягти повідомлення"

4. Історія:
   - Програма зберігає останні 3:
     * Оброблені файли
     * Використані патерни
     * Приховані повідомлення
     * Витягнуті повідомлення
   - Натисніть на будь-який елемент історії для його завантаження
        `);
    }

    showAbout() {
        alert(`
Обробник BMP зображень

Цей додаток дозволяє:
- Обробляти 24-бітні BMP зображення з різними патернами
- Приховувати та витягувати текстові повідомлення в зображеннях
        `);
    }

    showAuthors() {
        alert(`
Автори програми:
Павлюк Віталій Юрійович
Наумець Дмитро Андрійович
Юрків Андрій Андрійович
        `);
    }
}

const app = new App();
window.app = app; 
