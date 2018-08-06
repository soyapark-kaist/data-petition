/* More info: https://quilljs.com/docs/api/ */

function getContents(editor) {
    /* Returns 'delta' object.
    Refer to https://quilljs.com/docs/delta/ */
    var delta = editor.getContents();
    return delta;
}

function getText(editor, start, end) {
    var start = start || 0;
    var end = end || editor.getLength();
    return editor.getText(start, end);
}

function insertText(editor, text, start, options) {
    /*
    var option_example = {
        'color': '#ffff00',
        'italic': true
    });
    */
    var start = start || 0;
    var options = options || {};
    return editor.insertText(start, text, options);
}

function setContents(editor, delta) {
    /* Returns 'delta' object.
    Refer to https://quilljs.com/docs/delta/ */

    return editor.setContents(delta);;
}

function setText(editor, text) {
    return editor.setText(text);
}

function addEditingStopEventListener(callback) {
    editor.on('selection-change', function(delta, oldDelta, source) {
        if (delta == null) {
            callback();
        }
    });
}