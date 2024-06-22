/**
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */

/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
      .addItem('Start', 'showSidebar')
      .addToUi();
  google.html.run.mode();

}


// The color to highlight in is currently set to yellow but maybe in future versions this
// color can be chosen by the user.

const colorPreference ='#ffff00'; 

/**
 * Runs when the add-on is installed.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 */
function showSidebar() {
  const ui = HtmlService.createHtmlOutputFromFile('sidebar').setTitle("Rocío Perales Valdés, 2024");
  DocumentApp.getUi().showSidebar(ui);
}


function wordcount() {
  const doc = DocumentApp.getActiveDocument();
  var generalCount = 0;
  var excludeCount = 0;

  if (!doc) {
    throw new Error('No active document found.');
  }

  const body = doc.getBody();
  const paragraphs = body.getParagraphs(); // Get all paragraphs in the document
  paragraphs.forEach(function(paragraph) {
    const textElement = paragraph.editAsText();
    const text = textElement.getText();
    var lastUsedIndex = 0;
    if (text) {
      // Split text into words
      const words = text.split(/\s+/); // Split by spaces
      
      words.forEach(function(word) {
        Logger.log('word: '+ word);
        // Check that the word is alphanumeric and not a punctuation symbol
          if(includesAlphanumeric(word)){
            generalCount++;
            // Find first instance of the word starting from the last index it is necessary to begin at the last processed index to stop the code from finding an instance of the word that has already been processed (Ex: Hello World! Hello).
            const startOffset = text.indexOf(word, lastUsedIndex);
            const endOffset = startOffset+word.length; // Taking one more to also include the space after the word
            lastUsedIndex=endOffset;
       
          if (textElement.getBackgroundColor(startOffset) == colorPreference) { 
            excludeCount++;
          }
        }
        else{
            Logger.log('no alphanumeric')
        }
      });
      
    }
  });

  const modifiedCount = generalCount-excludeCount;
  Logger.log('General Count: ' + generalCount);
  Logger.log('Exclude Count: ' + excludeCount);
  return [generalCount,modifiedCount];// Return an array with the General Count at 0 and the modified at 1
}
function removeYellowHighlight(){
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();
  const paragraphs = body.getParagraphs(); // Get all paragraphs in the document
  paragraphs.forEach(function(paragraph) {
    // In Google Docs the paragraph element an have children of many types: equation, inlineImage, text, table. To adequately remove the highlighting in an equation setAttributes() is used instead of setBackgroundColor() as the latter proved ineffective

    for(let i = 0; i<paragraph.getNumChildren();i++){ // Loop through every child element in the paragraph
      if(paragraph.getChild(i).getType()==DocumentApp.ElementType.EQUATION){
        textOfElement = paragraph.getChild(i).editAsText();
        // If the BackgroundColor is yellow set to null
        if(textOfElement.getBackgroundColor()==colorPreference){
          var style = {};
          style[DocumentApp.Attribute.BACKGROUND_COLOR] = null;
          paragraph.getChild(i).setAttributes(style);
        }
      }
      else if (paragraph.getChild(i).getType()==DocumentApp.ElementType.TEXT){
        //For text it is important to loop character by character to ensure the removal of all yellow
        var index = 0;
        textElement = paragraph.getChild(i).editAsText();
        text = textElement.getText();
        while(index<text.length){
          if (textElement.getBackgroundColor(index) == colorPreference) { 
              textElement.setBackgroundColor(index, index, null); //only spans one character
          }
          index++;
        }
      }
    }
  });
}
function includesAlphanumeric(word){
  // If any of the characters in the word are alphanumeric return true
  for (const char of word) {
    if (char.match(/^[0-9a-z]+$/i)){// Regex including all letters and numbers
      return true;
    }
  }
  return false;
}

function showPopUp() {// To create the pop up
  var html = HtmlService.createHtmlOutputFromFile('tutorialPopUp')
      .setWidth(700)
      .setHeight(400);
  DocumentApp.getUi() 
      .showModalDialog(html, 'Tutorial');
}
// Currently unused, might be useful if the color to highlight becomes customisable by the user.
// Function is both used to highlight (set as to be removed from wordcount) and used to un-highlight (set as included in wordcount)
function highlightSelectedText(unhighlight){//function is both used to 
  var color = colorPreference;
  if (unhighlight){
    color = null;
  }
  const selection = DocumentApp.getActiveDocument().getSelection();
  if (selection) { // Check if selection exists
    const elements = selection.getRangeElements();
    for(let i = 0; i < elements.length; i++){ 
      const element = elements[i].getElement()
      // Only highlight if the element in the selection is text
      if (element.editAsText()){ 
        const textElement = element.editAsText();
        const startOffset = elements[i].getStartOffset();
        const endOffset = elements[i].getEndOffsetInclusive();
        textElement.setAttributes(startOffset, endOffset, {
          [DocumentApp.Attribute.BACKGROUND_COLOR]: color 
        });
      }
    }
  }
}
       
