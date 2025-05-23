export class AuthService {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.onAuthStateChange = null;
    }

    loadUsers() {
        return JSON.parse(localStorage.getItem('users')) || {};
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    login(username, password) {
        if (this.users[username] && this.users[username].password === password) {
            this.currentUser = username;
            this.notifyAuthStateChange();
            return true;
        }
        return false;
    }

    register(username, password) {
        if (this.users[username]) {
            return false;
        }

        this.users[username] = {
            password,
            history: {
                files: [],
                patterns: [],
                hiddenMessages: [],
                extractedMessages: []
            }
        };
        this.saveUsers();
        return true;
    }

    logout() {
        this.currentUser = null;
        this.notifyAuthStateChange();
    }

    addToHistory(type, item) {
        if (!this.currentUser) return;

        const history = this.users[this.currentUser].history;
        const list = history[type];
        
        list.unshift(item);
        if (list.length > 3) {
            list.pop();
        }

        this.saveUsers();
        return this.users[this.currentUser].history;
    }

    getUserHistory() {
        if (!this.currentUser) return null;
        return this.users[this.currentUser].history;
    }

    setAuthStateChangeListener(callback) {
        this.onAuthStateChange = callback;
    }

    notifyAuthStateChange() {
        if (this.onAuthStateChange) {
            this.onAuthStateChange(this.currentUser);
        }
    }
}

export const authService = new AuthService(); 