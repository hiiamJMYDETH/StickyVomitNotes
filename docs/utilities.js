export function setGuestMode(bool, emailInfo) {
    const user = {exists: bool, email: emailInfo}
    localStorage.setItem('guestMode', JSON.stringify(user));
}

export function getGuestMode() {
    const user = localStorage.getItem('guestMode');
    return user ? JSON.parse(user) : null;
}


export class TrieNode {
    constructor() {
        this.child = {};
        this.wordEnd = false;
    }
}

export class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word) {
        let node = this.root;
        for (const char of word) {
            if (!node.child[char]) {
                node.child[char] = new TrieNode();
            }
            node = node.child[char];
        }
        node.wordEnd = true;
    }

    search(word) {
        let node = this.root;
        for (const char of word) {
            if (!node.child[char]) {
                return false;
            }
            node = node.child[char];
        }
        return node.wordEnd;
    }

    searchPrefix(prefix) {
        let node = this.root;
        for (const char of prefix) {
            if (!node.child[char]) {
                return null;
            }
            node = node.child[char];
        }
        return node;
    }

    getWordsFromNode(node, prefix, words) {
        if (node.wordEnd) {
            words.push(prefix);
        }
        for (const char in node.child) {
            this.getWordsFromNode(node.child[char], prefix + char, words);
        }
    }

    autocomplete(prefix) {
        console.log(prefix);
        const prefixNode = this.searchPrefix(prefix);
        if (!prefixNode || prefix.length < 3) {
            console.log("Prefix node doesn't exist or the prefix is too short");
            return [];
        }
        const words = [];
        this.getWordsFromNode(prefixNode, prefix, words);
        return words;
    }
}