// Global Constants 
import { Trie, wordBank, setWordBank, dragElement, rightClickMenu, deleteRightClickMenu, generateNewNumber } from '../utilities.js';
import { saveANote, replaceTextwithAnother, insertNewBulletPoint, insertTab, bulletsymbols, getWordInProgress } from './note.js';

let count = 0;
let rightClickMenuToggle = false;
const addBtn = document.getElementById('new-note');
const deleteAllNotesBtn = document.getElementById('delete-all-notes');
const aboutBtn = document.getElementById('about');
const loginBtn = document.getElementById('login');
const accountBtn = document.getElementById('account-profile');
const saveAccChanges = document.querySelector('.button.save-account-changes');
const closeBtn = document.querySelector('.button.close-account-btn');
const searchBar = document.querySelector('.search-bar');
const trie = new Trie();
let titlesData = [];
let contentsData = [];
let noteStylesData = [];
let noteArray = [];
const token = localStorage.getItem('token');
var savedEmail = null;

function loadNotes(max) {
    if (!token) {
        return;
    }
    for (let i = 0; i < max; i++) {
        addNote(contentsData[i], titlesData[i]);
    }
}

function loadSavedStyles() {
    for (let i = 0; i < count; i++) {
        // const noteId = `note-${i}`;
        const noteId = noteArray[i].id;
        const element = document.getElementById(noteId);
        const savedStyles = noteStylesData[i];

        if (savedStyles && element) {
            const styleObject = savedStyles;

            for (let property in styleObject) {
                element.style[property] = styleObject[property];
            }
        } else {
            console.log(`No saved styles for note with ID ${noteId}`);
        }
    }
}

function addNote(text = "", title = "") {
    const note = document.createElement("div");
    const noteContainer = document.getElementById('note-div');
    const sampleTitle = `Untitled`;
    const sampleCont = `<div id="default-line" class="non-bullet-line">
        <div class="line-content" contenteditable="true">Hello World</div>
    </div>`

    note.classList.add("note-box");
    // note.id = `note-${count}`;
    note.id = `note-${generateNewNumber(count, noteArray)}`;
    note.innerHTML = `
        <div class="icons">
            <button class="button save-note" data-note-id="${count}">Save note</a>
            <button class="button delete-note" data-note-id="${count}">Delete note</button>
            <button class="button add-bulletpoints" data-note-id="${count}">Add bulletpoints</button>
        </div>
        <div class="title-div-note">
            <div contenteditable="true" class="title">
                ${title || sampleTitle}
            </div>
        </div>
        <div contenteditable="false" class="content">
            ${text || (sampleCont)}
        </div>
        <ul id="suggestions" class="suggestions" style="display: none; list-style-type: none; padding: 0; margin: 0; background-color: #fff; border: 1px solid #ccc; width: 20%"></ul>
    `;

    noteContainer.appendChild(note);
    dragElement(note);
    noteArray.push(note);
    console.log("note array", noteArray);
    count++;
    let enableBulletPoints = false;
    let defaultLine = title ? false : true;
    let currPrefixSequence = [];
    const noteContent = note.querySelector('.content');
    const suggestedList = note.querySelector('.suggestions');

    note.addEventListener('click', function (event) {
        this.focus();
        if (event.target.classList.contains('delete-note')) {
            console.log("current note", this);
            noteArray = noteArray.filter(note => note != this);
            note.remove();
            count--;
            saveToLocalStorage();
        }
        else if (event.target.classList.contains('save-note')) {
            if (!token) {
                alert('Login or make an account to save progress.');
                return;
            }
            saveANote(this);
            saveToLocalStorage();
            console.log('Note saved');
        }
        else if (event.target.classList.contains('add-bulletpoints')) {
            if (enableBulletPoints) {
                enableBulletPoints = false;
                document.querySelector('.add-bulletpoints').style.background = 'white';
                document.querySelector('.add-bulletpoints').style.color = 'black';
            }
            else {
                enableBulletPoints = true;
                document.querySelector('.add-bulletpoints').style.background = 'green';
                document.querySelector('.add-bulletpoints').style.color = 'white';
                insertNewBulletPoint(noteContent);
            }
        }
    });


    noteContent.addEventListener('keyup', function (event) {
        suggestedList.innerHTML = '';
        console.log("note currently editing", this);
        const currPrefix = getWordInProgress(this);
        const suggestedWords = trie.autocomplete(currPrefix);
        console.log('word still editing', currPrefix);
        console.log(suggestedWords);
        if (suggestedWords) {
            for (let i = 0; i < suggestedWords.length; i++) {
                const li = document.createElement('li');
                console.log(suggestedWords[i]);
                li.textContent = suggestedWords[i];
                suggestedList.appendChild(li);
                li.addEventListener('click', function (event) {
                    console.log(li.textContent);
                    replaceTextwithAnother(note, suggestedWords[i]);
                    suggestedList.style.display = 'none';
                })
            }
            suggestedList.style.display = 'block';
        }
        else {
            suggestedList.style.display = 'none';
        }
        currPrefixSequence.push(currPrefix);
    });

    noteContent.addEventListener('keydown', function (event) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (event.key === 'Tab') {
            event.preventDefault();

            if (enableBulletPoints) {
                const bulletLine = range.commonAncestorContainer.parentNode.closest('.line');

                if (!bulletLine) return;

                let indentLevel = (parseInt(bulletLine.style.marginLeft) / 20) || 0;

                if (!event.shiftKey) {
                    if (indentLevel === bulletsymbols.length - 1) return;
                    indentLevel++;
                    bulletLine.style.marginLeft = (parseInt(bulletLine.style.marginLeft) || 0) + 20 + 'px';
                } else {
                    indentLevel = Math.max(0, indentLevel - 1);
                    const currentIndent = parseInt(bulletLine.style.marginLeft) || 0;
                    bulletLine.style.marginLeft = Math.max(0, currentIndent - 20) + 'px';
                }

                const newBullet = bulletsymbols[indentLevel % bulletsymbols.length];
                let bulletSpan = bulletLine.querySelector('.bullet-point');
                if (!bulletSpan) {
                    bulletSpan = document.createElement('span');
                    bulletSpan.classList.add('bullet-point');
                    bulletLine.prepend(bulletSpan);
                }
                bulletSpan.textContent = newBullet;
            } else {
                insertTab(this, '\u2003');
            }
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            if (enableBulletPoints) {
                insertNewBulletPoint(this);
            }
            else {
                const newDiv = document.createElement('div');
                const contentDiv = document.createElement('div');
                contentDiv.classList.add('line-content');
                contentDiv.contentEditable = 'true';
                const br = document.createElement('br');
                newDiv.classList.add('non-bullet-line');
                contentDiv.appendChild(br);
                newDiv.appendChild(contentDiv);

                this.appendChild(newDiv);

                const range = document.createRange();
                const selection = window.getSelection();
                range.setStart(newDiv.querySelector('.line-content'), 0);
                range.collapse(true);

                selection.removeAllRanges();
                selection.addRange(range);

                newDiv.focus();
            }
            defaultLine = false;
        }
        if (event.key === 'Backspace') {
            let lastDeletedContent = '';
            const bulletLine = range.commonAncestorContainer.parentNode.parentNode.closest('.line');
            console.log(bulletLine);
            const currLine = range.commonAncestorContainer;
            const priorLine = bulletLine ? bulletLine.previousElementSibling : null;
            if (!range.collapsed) {
                event.preventDefault();
                lastDeletedContent = range.toString();
                range.deleteContents();
            } else if (bulletLine) {
                event.preventDefault();
                const lineContent = bulletLine.querySelector('.line-content').textContent.trim();
                let isLineRemoved = false;
                if (lineContent === '' || lineContent === '\u200B') {
                    bulletLine.remove();
                    isLineRemoved = true;
                }
                else if (range.startOffset > 0) {
                    const textNode = range.startContainer;
                    textNode.deleteData(range.startOffset - 1, 1);
                    range.setStart(textNode, range.startOffset);
                    range.collapse(true);
                }
                if (priorLine && isLineRemoved) {
                    const newRange = document.createRange();
                    const lineContent = priorLine.querySelector('.line-content');
                    const newTextLine = lineContent && lineContent.firstChild ? lineContent.firstChild : priorLine;
                    newRange.selectNodeContents(newTextLine);
                    newRange.collapse(false);

                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    priorLine.focus();
                }
            }
            else if (currLine && range.collapsed) {
                const priorLine = currLine.parentNode.previousElementSibling;
                if (!priorLine) {
                    if (currLine.parentNode.parentNode.id === 'default-line') {
                        console.log("it actually hits content");
                        defaultLine = true;
                    }
                    else if (currLine.className === "line-content" && defaultLine) {
                        console.log("it hits content");
                        event.preventDefault();
                    }
                    else if (currLine.length === 0 && defaultLine) {
                        event.preventDefault();
                    }
                    return;
                }
                this.removeChild(currLine.parentNode);
                const newRange = document.createRange();
                const newTextLine = priorLine.querySelector('.line-content') ? priorLine.querySelector('.line-content') : priorLine.parentNode;
                newRange.selectNodeContents(newTextLine);
                newRange.collapse(false);

                selection.removeAllRanges();
                selection.addRange(newRange);
                priorLine.focus();
            }
        }
        if (event.key === ' ') {
            const lastFinishedWord = currPrefixSequence[currPrefixSequence.length - 1];
            if (!lastFinishedWord) {
                return;
            }
            trie.insert(lastFinishedWord);
            wordBank.push(lastFinishedWord);
        }
    });

    noteContent.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        const selectedText = window.getSelection().toString();
        if (selectedText) {
            rightClickMenuToggle = true;
            rightClickMenu(selectedText, event.x, event.y, note);
        }
        else {
            console.log('No text selected.');
        }
    });

    noteContent.addEventListener('click', function (event) {
        if (rightClickMenuToggle) {
            deleteRightClickMenu();
            rightClickMenuToggle = false;
        }
    });
};

// saving notes to local storage

function saveToLocalStorage() {
    titlesData = [];
    contentsData = [];
    noteStylesData = [];
    var saveNoteToggle = false;
    for (let i = 0; i < count; i++) {
        // const noteId = `note-${i}`;
        console.log(noteArray);
        const noteId = noteArray[i].id;
        const note = document.getElementById(noteId);
        console.log(noteId);

        if (note) {
            const noteContent = note.querySelector('.content');
            const noteTitle = note.querySelector('.title');
            const styles = window.getComputedStyle(note);
            const styleObject = {};

            for (let property of styles) {
                if (property === 'top' || property === 'left') {
                    styleObject[property] = styles.getPropertyValue(property);
                }
            }
            titlesData.push(noteTitle.textContent.trim());
            contentsData.push(noteContent.innerHTML);
            noteStylesData.push(styleObject);
        }
        else {
            console.log(`Note with ID ${noteId} is not found.`)
        }
    }
    fetch('/users/save-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notesSaved: count, titlesSaved: JSON.stringify(titlesData), contentsSaved: JSON.stringify(contentsData), stylesSaved: JSON.stringify(noteStylesData), email: savedEmail }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.blob();
        })
        .catch((error) => console.error('Upload failed:', error));
    saveWordBank();
}

function saveWordBank() {
    fetch('/users/saveWB', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ words: JSON.stringify(wordBank), email: savedEmail })
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
        })
        .catch((error) => console.error('Download failed:', error));
}

// Functions related to menu buttons

addBtn.addEventListener('click', function () {
    addNote();
});

deleteAllNotesBtn.addEventListener('click', function () {
    for (let i = 0; i < count; i++) {
        const currNote = document.getElementById(`note-${i}`);
        if (currNote) {
            currNote.parentElement.removeChild(currNote);
        }
    }
    count = 0;
});

aboutBtn.addEventListener('click', function () {
    window.open('about.html', '_blank');
});

loginBtn.addEventListener('click', function () {
    window.open('login.html', '_blank');
});

accountBtn.addEventListener('click', function () {
    const accountProf = document.querySelector('.account-container');
    if (accountProf.style.display === 'none') {
        accountProf.style.display = 'grid';
        dragElement(accountProf);
        return;
    }
    accountProf.style.display = 'none';
});

document.getElementById('account-settings').addEventListener('click', function () {
    const changeAccSettings = document.getElementById('account-settings-cont');
    if (changeAccSettings.style.display === 'none') {
        changeAccSettings.style.display = 'grid';
        dragElement(changeAccSettings);
        return;
    }
    changeAccSettings.style.display = 'none';
});

saveAccChanges.addEventListener('click', function () {
    console.log(document.getElementById('old-pwd').textContent);
    console.log('Password is about to be changed');
    fetch('/users/change-password', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ pwd: document.getElementById('old-pwd').value, email: savedEmail })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Nothing');
        })
        .catch(err => {
            console.error('Error fetching account data:', err);
        });
});

closeBtn.addEventListener('click', function () {
    document.getElementById('account-settings-cont').style.display = 'none';
});

document.getElementById('logout').addEventListener('click', function () {
    localStorage.removeItem('token');
    window.open('index.html', '_blank');
});

searchBar.addEventListener('keyup', function (event) {
    const suggestedList = document.getElementById('search-suggestions');
    const currPrefix = getWordInProgress(this);
    const wordList = trie.autocomplete(currPrefix);
    if (wordList) {
        for (let i = 0; i < wordList.length; i++) {
            const li = document.createElement('li');
            console.log(wordList[i]);
            li.textContent = wordList[i];
            suggestedList.appendChild(li);
            li.addEventListener('click', function (event) {
                replaceTextwithAnother(searchBar, wordList[i]);
                suggestedList.style.display = 'none';
            })
        }
        suggestedList.style.display = 'block';
    }
    else {
        suggestedList.style.display = 'none';
    }
    if (event.key === 'Enter') {
        event.preventDefault();
        if (count === 0) {
            return;
        }
        for (let i = 0; i < count; i++) {
            const currNote = document.getElementById(`note-${i}`);
            const noteTitle = currNote.querySelector('.title');
            if (noteTitle.textContent.includes(searchBar.textContent)) {
                currNote.classList.toggle('glowing');
                currNote.addEventListener('click', function (event) {
                    if (currNote.classList.contains('glowing')) {
                        event.preventDefault();
                        currNote.classList.remove('glowing');
                    }
                    return;
                });
                suggestedList.style.display = 'none';
            }
        }
    }
});

document.getElementById('body').addEventListener('click', function (event) {
    console.log("it's hitting the autoblob");
    if (document.getElementById('search-suggestions').style.display === 'block') {
        document.getElementById('search-suggestions').style.display = 'none';
    }
});

document.getElementById('old-pwd').addEventListener('click', function () {
    this.focus();
});

// Upon loading the application, this one runs

const url = new URL('/users', window.location.origin);
fetch(url, {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-type': 'application/json'
    }
})
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Response from the backend', data.user);
        const user = data.user;
        const accountBtn = document.getElementById('account-profile');
        loginBtn.style.display = 'none';
        accountBtn.style.display = 'grid';
        accountBtn.innerHTML = `${user.username}`;
        titlesData = !null ? user.note_title_array : [];
        contentsData = !null ? user.note_content_array : [];
        noteStylesData = !null ? user.note_style_array : [];
        savedEmail = user.email;
        loadNotes(user.notes_saved);
        loadSavedStyles();
        if (user.word_bank) {
            setWordBank(user.word_bank);
        }
        setWordBank(wordBank);
        for (let i = 0; i < wordBank.length; i++) {
            trie.insert(wordBank[i]);
        }
    })
    .catch(err => {
        console.error('Error fetching account data:', err);
    });