export const bulletsymbols = ['•','◦', '▪', '‣'];

export function getWordInProgress(element) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    let string = range.commonAncestorContainer.textContent;
    let caretPosition = range.startOffset;
    let left = caretPosition - 1;
    let right = caretPosition;
    const stringLength = string.length;

    while ((left >= 0 && string[left] !== ' ') || (right < stringLength && string[right] !== ' ')) {
        if (left >= 0 && string[left] !== ' ') {
            left--;
        }
        if (right < stringLength && string[right] !== ' ') {
            right++;
        }
    }

    return string.substring(left + 1, right);
}

export function replaceTextwithAnother(note, newText) {
    note.focus();
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const string = range.commonAncestorContainer.textContent;
    const caretPosition = range.startOffset;
    let left = caretPosition - 1;
    let right = caretPosition;
    const stringLength = string.length;

    while ((left >= 0 && string[left] !== ' ') || (right < stringLength && string[right] !== ' ')) {
        if (left >= 0 && string[left] !== ' ') {
            left--;
        }
        if (right < stringLength && string[right] !== ' ') {
            right++;
        }
    }

    range.setStart(range.startContainer, left+1);
    range.setEnd(range.endContainer, right);  
    range.deleteContents();

    const newNode = document.createTextNode(newText);

    range.insertNode(newNode);

    range.setStartAfter(newNode);  
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
}

export function insertTab(element, textToInsert) {
    element.focus();

    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        range.collapse(true);

        const textNode = document.createTextNode(textToInsert);
        range.insertNode(textNode);

        range.setStartAfter(textNode);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
    }
};

export function insertNewBulletPoint(element) {
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


export function saveANote(note) {
    const contentBox = note.querySelector('.content');
    const noteContent = contentBox.querySelectorAll('.line-content');
    const noteTitle = note.querySelector('.title').textContent.trim();
    let contentArray = [];
    console.log(contentBox);
    console.log(noteTitle);
    noteContent.forEach((div) => {
        if (div.parentNode.className === "line") {
            let indentHelper = '';
            let indentLevel = (parseInt(div.parentNode.style.marginLeft) / 20) || 0;
            for (let i = 0; i < indentLevel; i++) {
                console.log(indentLevel);
                indentHelper += '\u2003';
            }
            contentArray.push(indentHelper + div.previousElementSibling.innerHTML + div.textContent);
        }
        else {
            contentArray.push(div.textContent);
        }
    });
    fetch('/upload-blob-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `${noteTitle}.txt`, content: contentArray }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.blob(); 
        })
        .then((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${noteTitle}.txt`; 
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url); 
        })
        .catch((error) => console.error('Download failed:', error));
    
}

