var selectedOperation = null;
var selectedClass = null;
var selectedElement = null;
var currentMenu = null;
var currentProgramName = "";

var currentId;
var currentSecret;
var currentEditor = null;

var programListText = localStorage.getItem('programList');
var programList = programListText == null ? {} : JSON.parse(programListText);
var savedContent = null;

window.console.log("program list: ", programList);

var EMPTY_PROGRAM = 
 '<tj-program-name>Unnamed</tj-program-name>' +
 '<tj-section id="values" style="display:none">' +
 '<tj-section-name>Values</tj-section-name>' + 
 '<tj-section-body>' +
 '<tj-block id="constants" style="display:none"><tj-block-name>Constants</tj-block-name><tj-block-body><textarea></textarea></tj-block>' + 
 '<tj-block id="globals" style="display:none"><tj-block-name>Global Variables</tj-block-name><tj-block-body><textarea></textarea></tj-block>' + 
 '</tj-section-body>' + 
 '</tj-section>' + 
 '<tj-section id="functions" style="display:none"><tj-section-name>Function</tj-section-name><tj-section-body></tj-section-body></tj-section>' +
 '<tj-section id="classes" style="display:none"><tj-section-name>Classes</tj-section-name><tj-section-body></tj-section-body></tj-section>' + 
 '<tj-section>' + 
 '<tj-section-name>Main</tj-section-name>' + 
 '<tj-section-body>' +
 '<tj-block id="main"><tj-block-name>Program body</tj-block-name><tj-block-body><textarea></textarea></tj-block-body>' +
 '</tj-section-body>' +
 '</tj-section>';
 


function autoresize(ta) {
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight+'px';
  ta.scrollTop = ta.scrollHeight;
  window.scrollTo(window.scrollLeft,(ta.scrollTop + ta.scrollHeight));
}


function addClass(name) {
  if (!name) {
    return;
  }

  var classesBlock = document.getElementById("classes").querySelector("tj-section-body");
  var classElement = classesBlock.firstElementChild;
  var newElement = document.createElement("tj-class");
  newElement.innerHTML = "<tj-class-name></tj-class-name><tj-class-body><tj-operation>" +
      "<tj-operation-signature>constructor()</tj-operation-signature>" +
      "<tj-operation-body><textarea></textarea></tj-operation-body>"+
      "</tj-operation></tj-class-body>";
  newElement.querySelector("tj-class-name").textContent = name;
  insertArtifact(classesBlock, newElement);
  select(newElement);
}

function addFunction(name, container) {
  if (!name) {
    return;
  }
  if (name.indexOf('(') == -1) {
    name += "()";
  }
  var newElement = document.createElement("tj-operation");
  newElement.innerHTML = "<tj-operation-signature></tj-operation-signature>" +
    "<tj-operation-body><textarea></textarea></tj-operation-body>";
  newElement.querySelector("tj-operation-signature").textContent = name;
  insertArtifact(container, newElement);
  select(newElement);
}

// Hide empty sections, open program body if there is no other section.
function cleanup() {
  var functions = document.getElementById("functions");
  var empty = 0;
  if (functions.querySelectorAll("tj-operation").length == 0) {
    functions.style.display = "none";
    empty++;
  }
  var classes = document.getElementById("classes");
  if (classes.querySelectorAll("tj-class").length == 0) {
    classes.style.display = "none";
    empty++;
  }
  if (document.getElementById("constants").style.display == "none" &&
      document.getElementById("globals").style.display == "none") {
    document.getElementById("values").style.display = "none";
    empty++;
  }


  if (empty == 3) {
    var blockNames = document.getElementById("program").querySelectorAll("tj-block-name");
    for (var i = 0; i < blockNames.length; i++) {
      if (blockNames[i].textContent == "Program body") {
        blockNames[i].parentNode.id = "main";
        break;
      }
    }

    var main = document.getElementById("main");
    if (main != null) {
      select(main);
    }
  }
}


function closeMenu() {
  if (currentMenu) {
    currentMenu.style.display = "none";
    currentMenu = null;
  }
}


function handleJsaction(name, element, event) {
  switch(name) {
    case 'add-class':
      modal.prompt("Class name?", "", addClass);
      break;

    case 'add-function':
      modal.prompt("Function name or signature?", "", function(name) {
         var container = document.getElementById("functions").querySelector("tj-section-body");
         addFunction(name, container);
      });
      break;

    case 'load':
      var id = element.getAttribute("data-id");
      var secret = element.getAttribute("data-secret");
      window.location.hash = "#id=" + id + (secret == null ? '' : (';secret=' + secret));
//      load();
      break;

    case 'load-menu':
      var menu = document.getElementById("load-menu");
      menu.innerHTML = "<div jsaction='menu' data-id='example-menu'>Examples</div>";
      for (var key in programList) {
        var entry = programList[key];
        var entryElement = document.createElement("div");
        entryElement.setAttribute("jsaction", "load");
        entryElement.setAttribute("data-id", entry['id']);
        entryElement.setAttribute("data-secret", entry['secret']);
        entryElement.textContent = key;
        menu.appendChild(entryElement);
      }
      openMenu("load-menu");
      break;

    case 'menu':
      openMenu(element.getAttribute("data-id"));
      break;

    case 'constants':
    case 'globals':
      select(document.getElementById(name));
      break;

    case "show-collaboration-url":
      save(function() {
        modal.prompt("<b>DANGER</b> &mdash; anybody with this URL can edit this program:", window.location.href);
      });
      break;

    case "show-run-url":
      save(function() {
        var url = window.location.href;
        var cut = url.lastIndexOf('/');
        var runUrl = url.substr(0, cut + 1) + "run.html#id=" + currentId;
        modal.prompt("Share this URL:", runUrl);
      });
      break;

    case 'new-program':
      localStorage.setItem("lastHash", "");
      window.location.hash = "#";
      break;

    case 'rename':
      modal.prompt("New Program Name?", currentProgramName, function(newName) {
        if (newName && newName != currentProgramName) {
          delete programList[currentProgramName];
          setName(newName);
          save();
        }
      });
      break;

    case 'run':
      save(function() {
         window.location = "run.html#id=" + currentId + (currentSecret == null ? "" : (";secret=" + currentSecret));
      });
      break;
  }  
}

function load() {
   var hash = window.location.hash;
   if (hash.length <= 1 && localStorage.getItem("lastHash")) {
     hash = localStorage.getItem("lastHash");
   } else {
     localStorage.setItem("lastHash", hash);
   }
   var params = io.parseParams(hash.substr(1));

   currentId = params['id'];
   currentSecret = params['secret'];

   var programElement = document.getElementById("program");

   selectedOperation = null;
   selectedClass = null;

   if (currentId == null) {
     programElement.innerHTML = EMPTY_PROGRAM;
     var newName = "Unnamed";
     var index = 2;
     while (programList[newName]) {
       newName = "Unnamed " + index++;
     }
     savedContent = programElement.innerHTML;
     setName(newName);
   } else {
     modal.showDeferred("Loading...");
     io.loadContent({id: currentId}, function(programXml) {
       modal.hide();
       programElement.innerHTML = programXml;
       savedContent = programElement.innerHTML;
       var programNameElement = programElement.querySelector("tj-program-name");
       setName(programNameElement == null ? "" + currentId : programNameElement.textContent);

       if (params["line"] && params["artifact"]) {
         var artifact = params["artifact"];
         var type = artifact[0];
         var artifactName = artifact.substr(2);
         if (type == 'f' || type == 'b') {
           // TODO: add a function for looking up a specific artifact
           var ops = document.body.querySelectorAll(type == 'f' ? "tj-operation-signature" : "tj-block-name");
           for (var i = 0; i < ops.length; i++) {
             if (ops[i].textContent == artifactName) {
               select(ops[i].parentNode);
               currentEditor.addLineClass(parseInt(params["line"]) - 1, 'wrap', 'line-error');
             }
           }
         }
         var line = params[line];
       }

     });
   }
}

function isConstructor(element) {
  return element.localName == "tj-operation" && element.parentNode.localName == "tj-class-body" &&
    element.firstElementChild.textContent.startsWith("constructor(");
}

function insertArtifact(container, artifact) {
  var name = artifact.firstElementChild.textContent;
  var child = container.firstChild;
  while (child != null) {
    var childName = child.firstElementChild.textContent;
    if (childName > name && !isConstructor(child)) {
      break;
    }
    child = child.nextElementSibling;
  }
  container.insertBefore(artifact, child);
}

function openContextMenu(element) {
  var elementName = element.localName;
  var name = element.textContent;

  var options;
  if (elementName == "tj-operation-signature") {
    if (isConstructor(element.parentNode)) {
      options = ["Change Signature"];
    } else {
      options = ["Change Signature", "Delete"];
    }
  } else if (elementName == "tj-class-name") {
    options = ["Add Method", "Rename", "Delete"];
  } else if (elementName == "tj-block") {
    options = ["Delete"];
    return;
  }

  modal.showMenu(element, "menu", options, function(result) {
    if (result == "Rename" || result == "Change Signature") {
      modal.prompt(result == "Rename" ? "New name: " : "New signature:", name, function(newName) {
        if (newName != name) {
          element.textContent = newName;
          var artifact = element.parentNode;
          var container = artifact.parentNode;
          container.removeChild(artifact);
          insertArtifact(container, artifact);
        }
      });
    } else if (result == "Delete") {
      modal.confirm("Delete " + name + "?", function(ok) {
        if (ok) {
          var artifact = element.parentNode;
          var container = artifact.parentNode;
          container.removeChild(artifact);
          cleanup();
        }
      });
    } else if (result == "Add Method") {
      modal.prompt("Method name or signature?", "", function(name) {
        var container = element.parentNode.querySelector("tj-class-body");
        addFunction(name, container);
      });
    } else {
      window.console.log("menu selection: ", result);
    }
  });
}

function openMenu(id) {
  closeMenu();
  currentMenu = document.getElementById(id);
  currentMenu.style.display = "block";
}


function save(callback) {
  var selected = selectedElement;
  select(null);  // detaches editor

  var textAreas = document.body.querySelectorAll('textarea');
  for (var i = 0; i < textAreas.length; i++) {
    textAreas[i].textContent = textAreas[i].value;
  }

  var program = document.body.querySelector('tj-program').innerHTML;
  select(selectedElement);

  if (program == savedContent) {
    callback();
  } else {
    modal.showDeferred("Saving...");
    io.saveContent(program, {id: currentId, secret: currentSecret}, function(params) {

      modal.hide();
      savedContent = program;
      currentId = params['id'];
      currentSecret = params['secret'];

      location.hash = "#id=" + currentId + ";secret=" + currentSecret;

      programList[currentProgramName] = {id: currentId, secret: currentSecret};
      localStorage.setItem('programList', JSON.stringify(programList));
      if (callback != null) {
        callback();
      }
    });
  }
}


function select(element) {
  if (currentEditor != null) {
    currentEditor.toTextArea();
    currentEditor = null;
  }
  if (element == null) {
    if (selectedOperation != null) {
      selectedOperation.removeAttribute('class');
      selectedOperation = null;
    }
    if (selectedClass != null) {
      selectedOperation.removeAttribute('class');
      selectedOperation = null;
    }
    selectedElement = null;
    return;
  }
  if (element.style.display == "none") {
    element.style.display = "";
  }
  var section = element.parentNode.parentNode;
  if (section && section.style.display == "none") {
    section.style.display = "";
  }

  if (selectedOperation != null && selectedOperation != element) {
    selectedOperation.className = '';
    selectedOperation = null;
  }

  if (element == selectedOperation) {
    // Toggle selected OP
    selectedOperation.removeAttribute('class');
    selectedOperation = null;
    selectedElement = selectedClass;
  } else if (element == selectedClass) {
    selectedClass.removeAttribute('class');
    selectedClass = null;
    selectedElement = null;
  } else {
    element.className = 'selected';
    if (element.localName == 'tj-class') {
      selectedClass = element;
    } else {
      selectedOperation = element;
      if (selectedClass != null && selectedClass != element.parentNode.parentNode) {
        selectedClass.removeAttribute('class');
        selectedClass = null;
      }
      var textarea = selectedOperation.querySelector('textarea');
      //autoresize(textarea);

      currentEditor = CodeMirror.fromTextArea(textarea, {mode: "javascript", lineWrapping: true});
    }
    selectedElement = element;
  }
}


function handleClick(event) {
  var element = event.target;
//  var menuHidden = currentMenu != null;
  closeMenu();

  if (element != null && (element.localName == 'tj-operation-signature' ||
      element.localName == 'tj-class-name' || element.localName == 'tj-block-name')) {
    if (event.clientX > event.target.clientWidth - 20) {
      openContextMenu(element);
    } else {
      select(element.parentNode);
    }
  } else {
    while (element != null) {
      var jsaction = element.getAttribute && element.getAttribute("jsaction");
      if (jsaction) {
        handleJsaction(jsaction, element, event);
        return;
      }
      element = element.parentNode;
    }
  }
};

function setName(name) {
  currentProgramName = name;
  document.title = "TideJ" + name.startsWith("Unnamed") ? "" : (": " + name);
  document.getElementById('title').textContent = name;
  var programNameElement = document.body.querySelector("tj-program-name");
  if (programNameElement == null) {
    programElement = document.body.querySelector("tj-program");
    programNameElement = document.createElement("tj-program-name");
    programElement.insertBefore(programNameElement, programElement.firstChild);
  }
  programNameElement.textContent = name;
}

// Event handlers


document.body.onclick = handleClick;

/*
document.body.oninput = function(event) {
  if (event.target.localName == 'textarea') {
    autoresize(event.target);
  }
};*/

document.body.ontouchstart = function(event) {
  touchStartElement = event.target;
  document.body.onclick = null;
}

document.body.ontouchend = function(event) {
  if (touchStartElement == event.target) {
    handleClick(event);
  }
}


window.onhashchange = load;
load();


