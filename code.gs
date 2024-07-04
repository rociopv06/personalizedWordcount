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

function getProperties() {
  const userProperties = PropertiesService.getUserProperties();

  // Returning an object with the fetched properties
  return {
    citationStyle: userProperties.getProperty('citationStyle'),
    excludeTables: userProperties.getProperty('excludeTables'),
    bibliographyStyle: userProperties.getProperty('bibliographyStyle'),
    customizableName: userProperties.getProperty('customizableName'),
  };
}
function setProperties(key, value) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty(key,value);
}
function highlightTables(){

  const body = DocumentApp.getActiveDocument().getBody(); 
  const tables = body.getTables(); // Get all tables in the document
  var found = false;
  tables.forEach(function(table) {
    found = true;
    var style = {};
    style[DocumentApp.Attribute.BACKGROUND_COLOR] = colorPreference;
    table.setAttributes(style);
  });
  if (!found){
    DocumentApp.getUi().alert("No tables were found in your document. If this is an error please report the bug");
  }

}
function highlightFromWordOn(word){
  const body = DocumentApp.getActiveDocument().getBody();
  const textElement= body.editAsText()
  const text = textElement.getText();
  const reg = new RegExp(word, 'gi');
  const matches = Array.from(text.matchAll(reg));
  
  const lastMatch = matches[matches.length-1];
  if (lastMatch==null) {
    DocumentApp.getUi().alert("The word '" + word + "' was not found in your document so Auto-highlighting failed");
    return;
  }

  textElement.setBackgroundColor(lastMatch.index, text.length - 1, colorPreference);

}
function highlightCitations(style){
  let reg;
  
  if (style == "APA") {
    reg = /(\([\w .]+,[ndABC \d]+(,.+)?\)|\(\d+[ABC ]*\))/g;
  } else if (style == "MLA") {
    reg = /\(([A-Z]{1}[\w\s]+)\)/g;
  } else if (style == "Chicago Author") {
    reg = /\([\w ]+, \d{1}.?\)/g;
  } else {
    return; // Exit if style is not recognized
  }

  const body = DocumentApp.getActiveDocument().getBody(); 
  const paragraphs = body.getParagraphs(); // Get all paragraphs in the document
  var found = false;
  paragraphs.forEach(function(paragraph) {
    const textElement = paragraph.editAsText();
    const text = textElement.getText();
    
    const matches = text.matchAll(reg);
    for (const match of matches) {
      found = true;
      const startOffset = match.index;
      const endOffset = match.index + match[0].length-1;
      textElement.setBackgroundColor(startOffset, endOffset, colorPreference); 
    }
  });
  if (!found){
    DocumentApp.getUi().alert("No citations were found. Please go to settings and re-select your citation style or report the bug");
  }
}

function scanHighlight(settings) {
 

  if (settings.citationStyle == ""&& settings.excludeTables =="n" 
   && settings.bibliographyStyle =="" && settings.customizableName=="") {

    DocumentApp.getUi().alert("No properties were selected to automatically highlight. Please go to settings");
    return; // Exit if style is empty
  }
  if(settings.excludeTables=="y"){

    highlightTables();
  }
  if(settings.bibliographyStyle!=""){

    highlightFromWordOn(settings.bibliographyStyle);
  }
  if(settings.customizableName!=""){
    highlightFromWordOn(settings.customizableName);
  }
  if(settings.citationStyle!=""){
    highlightCitations(settings.citationStyle);
  }

}

/*
REGEX:
APA match dates in parenthesis, also matches dates such as 20 BC  /\(\d[+| |\w]+\)/
APA matches author + date  /\([\w .]+,[ndbca \d]+(,.+)?\)/
MLA match /\(([A-Z]{1}[\w\s]+)\)/
Chicago author /\([\w ]+, \d{1}.?\)/
*/


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

        }
      });
      
    }
  });

  const modifiedCount = generalCount-excludeCount;

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
  if (word.match(/[0-9A-Za-zÀ-ÖØ-öø-ÿ]/)){// Regex including all letters (with accents) and numbers 
    //this does not match all alphabets so it is due a future fix to include more alphabets
    //old regex: /^[0-9a-z]+$/i
    return true;
    }
  return false;
  /*
  for (const char of word) {
    if (char.match(/[0-9a-zA-Z]/i)){// Regex including all letters and numbers 
    //old regex: /^[0-9a-z]+$/i
      return true;
    }
  }
  return false;
  */
}

function showPopUp(fileName, title, width, height) {// To create the pop up
  var html = HtmlService.createHtmlOutputFromFile(fileName)
      .setWidth(width)
      .setHeight(height);
  DocumentApp.getUi() 
      .showModalDialog(html, title);
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
       
