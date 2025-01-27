import { replaceTextwithAnother } from "./scripts/note.js";

export function setWordBank(bank) {
    wordBank = bank;
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
        const prefixNode = this.searchPrefix(prefix);
        if (!prefixNode || prefix.length < 2) {
            console.log("Prefix node doesn't exist or the prefix is too short");
            return [];
        }
        const words = [];
        this.getWordsFromNode(prefixNode, prefix, words);
        return words;
    }
}

function copy(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy text', err)
        });
    } 
    else {
        document.execCommand('copy');
        console.log('Text copied to clipboard');
    }
}

export function rightClickMenu(text, mouseX, mouseY, note) {
    const menu = document.createElement('div');
    const noteContainer = document.getElementById('note-div');
    const noteContent = note.querySelector('.content');
    menu.classList.add('right-click-menu');
    menu.id = 'right-click-menu-id';
    if (menu.id) {
        deleteRightClickMenu();
    }
    menu.innerHTML = `
            <button class="button ask-Google" id="ask-Google">Search on Google</button>
            <button class="button cut" id="cut-selected-text">Cut</button>
            <button class="button copy" id="copy-selected-text">Copy</button>
            <button class="button paste" id="paste-copied-text">Paste</button> 
    `;
    noteContainer.appendChild(menu);
    menu.style.top = mouseY + 'px';
    menu.style.left = mouseX + 'px';
    menu.addEventListener('click', async function(event) {
        if (event.target.classList.contains('ask-Google')) {
            const googleSearchUrl = `https://www.google.com/search?q=${text}`;
            window.open(googleSearchUrl, '_blank');
        }
        else if (event.target.classList.contains('cut')) {
            copy(text);
            replaceTextwithAnother(noteContainer, '');

        }
        else if (event.target.classList.contains('copy')) {
            copy(text);
        }
        else if (event.target.classList.contains('paste')) {
            if (navigator.clipboard) {
                const copiedText = await navigator.clipboard.readText();
                replaceTextwithAnother(noteContainer, copiedText);
            }
            else {
                alert('Clipboard API is not working.');
            }
        }
    })

}

export function deleteRightClickMenu() {
    const menu = document.querySelector('.right-click-menu');
    if (menu) {
        menu.remove();
    }
    else {
        console.log('No menu created.');
    }
}

export function dragElement(el) {
    let isDragging = false;
    let startX, startY;

    function dragMouseDown(e) {
        if (!e.target.classList.contains("content") && !e.target.classList.contains("line-content") && !e.target.classList.contains("title")) {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            document.addEventListener("mousemove", elementDrag);
            document.addEventListener("mouseup", stopDrag);
        }
    }

    function elementDrag(e) {
        if (isDragging) {
            e.preventDefault();
            let posX = startX - e.clientX;
            let posY = startY - e.clientY;
            startX = e.clientX;
            startY = e.clientY;
            el.style.top = (el.offsetTop - posY) + "px";
            el.style.left = (el.offsetLeft - posX) + "px";
        }
    }

    function stopDrag() {
        isDragging = false;
        document.removeEventListener("mousemove", elementDrag);
        document.removeEventListener("mouseup", stopDrag);
    }

    el.addEventListener("mousedown", dragMouseDown);
}


export var wordBank = ["the", "of", "to", "and", "in", "is", 
    "it", "you", "that", "he", "was", "for", "on", "are", "with",
    "as", "his", "they", "be", "at", "one", "have", "this",
    "from", "or", "had", "by", "hot", "but", "some", "what", 
    "there", "we", "can", "out", "other", "were", "all", "your",
    "when", "up", "use", "word", "how", "said", "an", "each", 
    "she", "which", "do", "their", "time", "if", "will", "way",
    "about", "many", "then", "them", "would", "write", "like",
    "so", "these", "her", "long", "make", "thing", "see", "him",
    "two", "has", "look", "more", "day", "could", "go", "come",
    "did", "my", "sound", "no", "most", "number", "who", "over",
    "know", "water", "than", "call", "first", "people", "may", 
    "down", "side", "been", "now", "find", "any", "new", "work",
    "part", "take", "get", "place", "made", "live", "where", 
    "after", "back", "little", "only", "round", "man", "year",
    "came", "show", "every", "good", "me", "give", "our", "under",
    "name", "very", "through", "just", "form", "much", "great",
    "think", "say", "help", "low", "line", "before", "turn",
    "cause", "same", "mean", "differ", "move", "right", "boy",
    "old", "too", "does", "tell", "sentence", "set", "three",
    "want", "air", "well", "also", "play", "small", "end", "put",
    "home", "read", "hand", "port", "large", "spell", "add",
    "even", "land", "here", "must", "big", "high", "such",
    "follow", "act", "why", "ask", "men", "change", "went", 
    "light", "kind", "off", "need", "house", "picture", "try", 
    "us", "again", "animal", "point", "mother", "world", "near",
    "build", "self", "earth", "father", "head", "stand", "own",
    "page", "should", "country", "found", "answer", "school", 
    "grow", "study", "still", "learn", "plant", "cover", "food",
    "sun", "four", "thought", "let", "keep", "eye", "never", 
    "last", "door", "between", "city", "tree", "cross", "since",
    "hard", "start", "might", "story", "saw", "far", "sea", 
    "draw", "left", "late", "run", "don't", "while", "press",
    "close", "night", "real", "life", "few", "stop", "open", 
    "seem", "together", "next", "white", "children", "begin", 
    "got", "walk", "example", "ease", "paper", "often", "always",
    "music", "those", "both", "mark", "book", "letter", "until",
    "mile", "river", "car", "feet", "care", "second", "group",
    "carry", "took", "rain", "eat", "room", "friend", "began", 
    "idea", "fish", "mountain", "north", "once", "base", "hear",
    "horse", "cut", "sure", "watch", "color", "face", "wood", 
    "main", "enough", "plain", "girl", "usual", "young", "ready",
    "above", "ever", "red", "list", "though", "feel", "talk", 
    "bird", "soon", "body", "dog", "family", "direct", "pose", 
    "leave", "song", "measure", "state", "product", "black", 
    "short", "numeral", "class", "wind", "question", "happen", 
    "complete", "ship", "area", "half", "rock", "order", "fire", 
    "south", "problem", "piece", "told", "knew", "pass", "farm", 
    "top", "whole", "king", "size", "heard", "best", "hour", 
    "better", "true", "during", "hundred", "am", "remember", 
    "step", "early", "hold", "west", "ground", "interest", 
    "reach", "fast", "five", "sing", "listen", "six", "table", 
    "travel", "less", "morning", "ten", "simple", "several", 
    "vowel", "toward", "war", "lay", "against", "pattern", 
    "slow", "center", "love", "person", "money", "serve", 
    "appear", "road", "map", "science", "rule", "govern", 
    "pull", "cold", "notice", "voice", "fall", "power", 
    "town", "fine", "certain", "fly", "unit", "lead", "cry", 
    "dark", "machine", "note", "wait", "plan", "figure", "star", 
    "box", "noun", "field", "rest", "correct", "able", "pound", 
    "done", "beauty", "drive", "stood", "contain", "front", 
    "teach", "week", "final", "gave", "green", "oh", "quick", 
    "develop", "sleep", "warm", "free", "minute", "strong", 
    "special", "mind", "behind", "clear", "tail", "produce", 
    "fact", "street", "inch", "lot", "nothing", "course", 
    "stay", "wheel", "full", "force", "blue", "object", "decide", 
    "surface", "deep", "moon", "island", "foot", "yet", "busy", 
    "test", "record", "boat", "common", "gold", "possible", 
    "plane", "age", "dry", "wonder", "laugh", "thousand", "ago", 
    "ran", "check", "game", "shape", "yes", "hot", "miss", 
    "brought", "heat", "snow", "bed", "bring", "sit", "perhaps", 
    "fill", "east", "weight", "language", "among"];