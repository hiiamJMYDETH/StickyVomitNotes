export function setGuestMode(bool, emailInfo) {
    const user = {exists: bool, email: emailInfo}
    localStorage.setItem('guestMode', JSON.stringify(user));
}

export function getGuestMode() {
    return JSON.parse(localStorage.getItem('guestMode'));
}


class TrieNode {
    constructor(languageName) {
        if (languageName === 'english') {
            this.maxChars = 52;
            this.maxChildren(52);
            this.isEndOfWord = false;
        }
    }
};

class Trie {
    constructor(languageName) {
        if (languageName === 'english') {
            ;
        }
    }
}