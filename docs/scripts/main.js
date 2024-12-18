// Global Constants 
let count = 0;
let rightClickMenuToggle = false;
let originalDivStructure;  
const addBtn = document.getElementById('new-note');
const deleteAllNotesBtn = document.getElementById('delete-all-notes');
const saveAllNotesBtn = document.getElementById('save-notes');
const histBtn = document.getElementById('note-history');
const aboutBtn = document.getElementById('about');
const bulletsymbols = ['•','◦', '▪', '‣'];


// menu buttons
addBtn.addEventListener('click', function() {
    addNote();
})

deleteAllNotesBtn.addEventListener('click', function() {
    const noteContainer = document.getElementById('notes-div');
    for (let i = 0; i < count; i++) {
        const currNote = document.getElementById(`note-${i}`);
        currNote.delete();
    }
    count = 0;
})

saveAllNotesBtn.addEventListener('click', function() {
    saveNotes();
})

aboutBtn.addEventListener('click', function() {
    window.open('about.html', '_blank')
})

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

function saveANote(noteId) {
    const contentBox = document.querySelector('.content');
    const noteContent = contentBox.querySelectorAll('.line-content');
    const noteTitle = document.querySelector('.title').textContent.trim();
    let contentArray = [];
    console.log(contentBox);
    console.log(noteTitle);
    noteContent.forEach((div) => {
        if (div.parentNode.className === "line") {
            console.log("there's a bullet point");
        }
        console.log("Adding:", div.textContent);
        contentArray.push(div.textContent);
    });
    // const jsonData = {fileName: `${noteTitle}.txt`, content: contentArray};
    const blob = new Blob(contentArray, {type: 'text/plain'});
    // fetch('/upload-blob-json', {
    //     method: 'POST',
    //     headers: {'Content-Type': 'application/json'},
    //     body: JSON.stringify(jsonData)
    // })
    // .then((response) => response.json())
    // .then((data) => console.log(data))
    // .catch((error) => console.error('Error:', error));
    blob.text().then((textContent) => {
        fetch('/upload-blob-json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: `${noteTitle}.txt`, content: textContent }),
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Failed to upload blob.');
            })
            .then((data) => {
                console.log('Server response:', data);
            })
            .catch((error) => {
                console.error('Error uploading blob:', error);
            });
    });

}

// saving notes to local storage
function saveNotes() {
    // const notes = document.querySelectorAll('.note-box');
    const notesContent = document.querySelectorAll('.note-box .content');
    const titles = document.querySelectorAll('.note-box .title');
    const data = [];
    notesContent.forEach((note, index) => {
        const content = note.innerHTML;
        const title = titles[index].textContent;
        if (content.trim() != "") {
            data.push({title, content});
        }
    });

    const titlesData = data.map((item) => item.title);
    localStorage.setItem(
        "titles", JSON.stringify(titlesData)
    );
    const contentData = data.map((item) => item.content);
    localStorage.setItem(
        "notes", JSON.stringify(contentData)
    );
    saveStyles();
}

function saveStyles() {

    for (let i = 0; i < count; i++) {
        const noteId = `note-${i}`;
        const note = document.getElementById(noteId);

        if (note) {
            const styles = window.getComputedStyle(note);
            const styleObject = {};

            for (let property of styles) {
                if (property === 'top' || property === 'left') {
                    styleObject[property] = styles.getPropertyValue(property);
                }
            }
            localStorage.setItem(`savedStyles-${noteId}`, JSON.stringify(styleObject));
        }
        else {
            console.log(`Note with ID ${noteId} is not found.`)
        }
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

function rightClickMenu(selectedText, mouseX, mouseY, note) {
    addRightClickMenu(selectedText, mouseX, mouseY, note);
}

const addRightClickMenu = (text, mouseX, mouseY, note) => {
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
    rightClickMenuToggle = true;
    menu.addEventListener('click', async function(event) {
        if (event.target.classList.contains('ask-Google')) {
            const googleSearchUrl = `https://www.google.com/search?q=${text}`;
            window.open(googleSearchUrl, '_blank');
        }
        else if (event.target.classList.contains('cut')) {
            const caretPosition = noteContent.selectionStart;
            copy(text);
            const restOfText = noteContent.value.slice(0, caretPosition) + noteContent.value.slice(caretPosition + text.length, noteContent.end);
            noteContent.value = restOfText;

        }
        else if (event.target.classList.contains('copy')) {
            copy(text);
        }
        else if (event.target.classList.contains('paste')) {
            if (navigator.clipboard) {
                const copiedText = await navigator.clipboard.readText();
                const caretPosition = noteContent.selectionStart;
                const textBeforeCaret = noteContent.value.slice(0, caretPosition);
                noteContent.value = textBeforeCaret + copiedText + noteContent.value.slice(caretPosition, noteContent.end);
            }
            else {
                alert('Clipboard API is not working.');
            }
        }
    })

}

function deleteRightClickMenu() {
    const menu = document.querySelector('.right-click-menu');
    if (menu) {
        menu.remove();
        rightClickMenuToggle = false;
    }
    else {
        console.log('No menu created.');
    }
}

const addNote = (text = "", title = "") => {
    const note = document.createElement("div");
    const noteContainer = document.getElementById('note-div');
    const sampleTitle = `Untitled`;
    const sampleCont = `<div id="default-line" class="non-bullet-line">
        <div class="line-content" contenteditable="true">Hello World</div>
    </div>`
    
    note.classList.add("note-box");
    note.id = `note-${count}`;
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
        <div contenteditable="true" class="content">
            ${text || (sampleCont)}
        </div>
    `;

    noteContainer.appendChild(note);
    dragElement(note);
    count++; 
    let enableBulletPoints = false;
    let defaultLine = title ? false : true;
    let lastDeletedContent = '';


    noteContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-note')) {
            const noteId = event.target.getAttribute('data-note-id');
            const currentNote = document.getElementById(`note-${noteId}`);
            if (currentNote) {
                currentNote.remove();
                count--;
                saveNotes();
            }
        }
        else if (event.target.classList.contains('save-note')) {
            saveANote(note.id);
            saveNotes();
            console.log('Note saved');
        }
    });

    const noteContent = note.querySelector('.content');
    noteContent.addEventListener('keydown', function(event) {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (event.key === 'Tab') {
            event.preventDefault();
            
            if (enableBulletPoints) {
                const bulletLine = range.commonAncestorContainer.parentNode.closest('.line'); // Or the bullet line's container class
                
                if (!bulletLine) return;
    
                // Get current indent level
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
    
                // Update bullet symbol based on indent level
                const newBullet = bulletsymbols[indentLevel % bulletsymbols.length];
                let bulletSpan = bulletLine.querySelector('.bullet-point');
                if (!bulletSpan)  {
                    bulletSpan = document.createElement('span');
                    bulletSpan.classList.add('bullet-point');
                    bulletLine.prepend(bulletSpan);
                }
                bulletSpan.textContent = newBullet;
            } else {
                insertTextInContentEditable(this, '\u2003'); // Inserts an em-space
            }
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            if (enableBulletPoints) {
                insertNewBulletPoint(this);
            }
            else {
                const newDiv = document.createElement('div');
                // const br = document.createElement('br');
                // newDiv.classList.add('non-bullet-line');
                // br.classList.add('line-content');
                // br.contentEditable = 'true';
                // newDiv.appendChild(br);
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
            const bulletLine = range.commonAncestorContainer.parentNode.closest('.line');
            const currLine = range.commonAncestorContainer;
            const priorLine = bulletLine ? bulletLine.previousElementSibling : null;
            if (!range.collapsed) {
                event.preventDefault();
                lastDeletedContent = range.toString();
                range.deleteContents();
                console.log("it's about to delete a word");
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
                    console.log(priorLine);
                    const lineContent = priorLine.querySelector('.line-content');
                    console.log(priorLine);
                    const newTextLine = lineContent && lineContent.firstChild ? lineContent.firstChild : priorLine; // Currently having an issue with the bulletpoint thing where it focuses on the 
                    console.log(newTextLine);
                    // const newTextLine = priorLine.querySelector('.line-content').firstChild ? priorLine.querySelector('.line-content').firstChild : priorLine.querySelector('.line-content');
                    newRange.selectNodeContents(newTextLine);
                    newRange.collapse(false);
    
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    priorLine.focus();
                }
            }
            if (currLine && range.collapsed) {
                const priorLine = currLine.parentNode.previousElementSibling;
                if (currLine.className === "line-content" && defaultLine) {
                    console.log("it hits content");
                    event.preventDefault();
                    return;
                }
                if (priorLine) {
                    if (priorLine.id === "default-line") {
                        defaultLine = true;
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
        }
        
    });

    noteContent.addEventListener('contextmenu', function(event) {
        event.preventDefault();
        const selectedText = window.getSelection().toString();
        if (selectedText) {
            rightClickMenu(selectedText, event.x, event.y, note);
        }
        else {
            console.log('No text selected.');
        }
    });

    noteContent.addEventListener('click', function(event) {
        if (rightClickMenuToggle) {
            deleteRightClickMenu();
        }
    });

    const addBulletPointsBtn = note.querySelector('.add-bulletpoints');
    addBulletPointsBtn.addEventListener('click', function(event) {
        if (enableBulletPoints) {
            enableBulletPoints = false;
            addBulletPointsBtn.style.background = 'white';
            addBulletPointsBtn.style.color = 'black';
        }
        else {
            enableBulletPoints = true;
            addBulletPointsBtn.style.background = 'green';
            addBulletPointsBtn.style.color = 'white';
            insertNewBulletPoint(noteContent);
        }
    });
};

const insertTextInContentEditable = (element, textToInsert) => {
    // Ensure the contenteditable element is in focus
    element.focus();

    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Collapse the range to the cursor position
        range.collapse(true);

        // Create a new text node and insert it at the cursor position
        const textNode = document.createTextNode(textToInsert);
        range.insertNode(textNode);

        // Move the cursor to after the inserted text
        range.setStartAfter(textNode);
        range.collapse(true);

        // Update the selection
        selection.removeAllRanges();
        selection.addRange(range);
    }
};

function insertNewBulletPoint(element) {
    element.focus();
    const newLine = createNewLine();
    const newEditable = newLine.querySelector('.line-content');
    element.appendChild(newLine);

    const range = document.createRange();
    const selection = window.getSelection();

    range.setStart(newEditable.firstChild, 1);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);

}

// The line thingy is way too complicated, so let's clung them into one function.
function createNewLine() {
    const newLine = document.createElement('div');
    newLine.classList.add('line');
    newLine.contentEditable = 'false';
    const bullet = document.createElement('span');
    bullet.classList.add('bullet-point');
    bullet.innerHTML = `${bulletsymbols[0]}`;
    const editable = document.createElement('div');
    editable.classList.add('line-content');
    editable.contentEditable = 'true';
    editable.textContent = '\u200B';
    newLine.appendChild(bullet);
    newLine.appendChild(editable);
    return newLine;
}


function dragElement(el) {
    let isDragging = false;
    let startX, startY;

    function dragMouseDown(e) {
        // Only start drag if the click is outside of the contenteditable area
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

    // Attach the dragMouseDown only once
    el.addEventListener("mousedown", dragMouseDown);
}

function loadNotes() {
    const titlesData = JSON.parse(localStorage.getItem("titles")) || [];
    const contentData = JSON.parse(localStorage.getItem("notes")) || [];

    for (let i = 0; i < Math.max(titlesData.length, contentData.length); i++) { 
        addNote(contentData[i], titlesData[i]);
    }
}

function loadSavedStyles() {
    for (let i = 0; i < count; i++) {
        const noteId = `note-${i}`;
        const element = document.getElementById(noteId);
        const savedStyles = localStorage.getItem(`savedStyles-${noteId}`);
    
        if (savedStyles && element) {
            const styleObject = JSON.parse(savedStyles);
    
            for (let property in styleObject) {
                element.style[property] = styleObject[property];
            }
        } else {
            console.log(`No saved styles for note with ID ${noteId}`);
        }
    }
}

loadNotes();
loadSavedStyles();
