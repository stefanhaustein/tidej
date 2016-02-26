var selectedOperation = null;
var selectedClass = null;
var selectedElement = null;
var currentMenu = null;
var currentProgramName = "";

var currentId;
var currentSecret;
var currentEditor = null;
var currentError = null;

var programListText = localStorage.getItem('programList');
var programList = programListText == null ? {} : JSON.parse(programListText);
var savedContent = null;


var EMPTY_CLASS_INNER =
  "<tj-class-name></tj-class-name><tj-class-body><tj-operation>" +
  "<tj-operation-signature>constructor()</tj-operation-signature>" +
  "<tj-operation-body></tj-operation-body>"+
  "</tj-operation></tj-class-body>"

var EMPTY_OPERATION_INNER =
  "<tj-operation-signature></tj-operation-signature>" +
  "<tj-operation-body></tj-operation-body>";

var EMPTY_PROGRAM_INNER =
 '<tj-program-name>Unnamed</tj-program-name>' +
 '<tj-section id="values" style="display:none">' +
 '<tj-section-name>Values</tj-section-name>' + 
 '<tj-section-body>' +
 '<tj-block id="constants" style="display:none"><tj-block-name>Constants</tj-block-name><tj-block-body></tj-block>' +
 '<tj-block id="globals" style="display:none"><tj-block-name>Global Variables</tj-block-name><tj-block-body></tj-block>' +
 '</tj-section-body>' + 
 '</tj-section>' + 
 '<tj-section id="functions" style="display:none"><tj-section-name>Function</tj-section-name><tj-section-body></tj-section-body></tj-section>' +
 '<tj-section id="classes" style="display:none"><tj-section-name>Classes</tj-section-name><tj-section-body></tj-section-body></tj-section>' + 
 '<tj-section>' + 
 '<tj-section-name>Main</tj-section-name>' + 
 '<tj-section-body>' +
 '<tj-block id="main"><tj-block-name>Program body</tj-block-name><tj-block-body></tj-block-body>' +
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
  newElement.innerHTML = EMPTY_CLASS_INNER;
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
  newElement.innerHTML = EMPTY_OPERATION_INNER;
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

function findFunction(signature, optParent) {
  var parent = optParent || document.getElementById("functions");
  var elements = parent.querySelectorAll("tj-operation-signature");
  for (var i = 0; i < elements.length; i++) {
    if (elements[i].textContent == signature) {
      return elements[i].parentNode;
    }
  }
  return null;
}

function findBlock(name) {
  var parent = document.getElementById("program");
  var elements = parent.querySelectorAll("tj-block-name");
  for (var i = 0; i < elements.length; i++) {
    if (elements[i].textContent == name) {
      return elements[i].parentNode;
    }
  }
  return null;
}

function findMethod(className, signature) {
  var parent = document.getElementById("program");
  var elements = parent.querySelectorAll("tj-class-name");
  for (var i = 0; i < elements.length; i++) {
    if (elements[i].textContent == name) {
      return findFunction(signature, elements[i].parentNode);
    }
  }
  return null;
}

function handleJsaction(name, element, event) {
  switch(name) {
    case 'about':
      modal.alert(
        '<h3>Tidej</h3>' +
        '<p>Tiny IDE for Javascript; ' +
        'for more information, visit <a href="http://tidej.net"  target="_blank">tidej.net</a>.</p>' +
        '<p>(C) 2016 Stefan Haustein, Z&uuml;rich, Switzerland.</p>');
      break;

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
      window.location.hash = "#id=" + id;
//      load();
      break;

    case 'load-dialog':
      var newList = {};
      var options = [];
      for (var id in programList) {
        var entry = programList[id];
        if (entry.id) {
          entry.name = id;
          id = entry.id;
          entry.id = null;
        }
        if (id == entry.name || entry.secret == null) {
          continue;
        }
        newList[id] = entry;

        var name = entry.name + " (" + id + ")";

        var targetIndex = options.length;
        for (var i = 0; i < options.length; i += 2) {
          if (options[i] > name) {
            targetIndex = i;
            break;
          }
        }
        options.splice(targetIndex, 0, name, id)
      }
      programList = newList;
      //options.sort();

      modal.choice("Open program", options, function(id) {
        if (id != null) {
          var entry = programList[id];
          var hash = "#id=" + id;
          if (entry) {
            hash += ';secret=' + entry.secret
          }
          window.location.hash = hash;
        }
      });
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
     programElement.innerHTML = EMPTY_PROGRAM_INNER;
     var newName = "Unnamed";
     var index = 2;
     var conflict;
     do {
       conflict = false;
       for (var id in programList) {
         if (programList[id].name == newName) {
           conflict = true;
           newName = "Unnamed " + index++;
           break;
         }
       }
     } while (conflict);
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

       var errorString = localStorage.getItem("tidej.error");
       if (errorString && errorString != "null") {
         localStorage.removeItem("tidej.error");
         currentError = JSON.parse(errorString);
         showError(currentError);
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
  } else if (elementName == "tj-block-name") {
    options = ["Clear"];
  } else {
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
          if (artifact == selectedElement) {
            select(null);
          }
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
    } else if (result == "Clear") {
      modal.confirm("Clear " + name + "?", function(ok) {
        if (ok) {
          var artifact = element.parentNode;
          if (artifact == selectedElement) {
            select(null);
          }
          var body = artifact.querySelector("tj-block-body");
          body.innerHTML = "";
          if (name != "Program body") {
            artifact.style.display = "none";
          }
          cleanup();
        }
      });
    } else {
      window.console.log("unhandled menu selection: ", result);
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

  var program = document.body.querySelector('tj-program').innerHTML;
  select(selectedElement);

  if (program == savedContent) {
    callback();
  } else {
    modal.showDeferred("Saving...");
    io.saveContent(program, {id: currentId, secret: currentSecret, name: currentProgramName}, function(params) {

      modal.hide();
      savedContent = program;
      currentId = params['id'];
      currentSecret = params['secret'];

      location.hash = "#id=" + currentId + ";secret=" + currentSecret;

      programList[currentId] = {name: currentProgramName, secret: currentSecret};
      localStorage.setItem('programList', JSON.stringify(programList));
      if (callback != null) {
        callback();
      }
    });
  }
}


var lintTimer;

function select(element) {
  if (currentEditor != null) {
    var value = currentEditor.getValue();
    var body = selectedElement.querySelector("tj-operation-body,tj-block-body");
    body.textContent = value;
    currentEditor = null;
  }
  if (element == null) {
    if (selectedOperation != null) {
      selectedOperation.removeAttribute('class');
      selectedOperation = null;
    }
    if (selectedClass != null) {
      selectedClass.removeAttribute('class');
      selectedClass = null;
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
    if (selectedClass != null && selectedClass != element.parentNode.parentNode) {
      selectedClass.removeAttribute('class');
      selectedClass = null;
    }
    if (element.localName == 'tj-class') {
      selectedClass = element;
    } else {
      selectedOperation = element;

      var body = selectedOperation.querySelector('tj-operation-body,tj-block-body');
      //autoresize(textarea);

      //currentEditor = CodeMirror.fromTextArea(textarea, );

      var content = body.textContent;
      body.innerHTML = "";
      currentEditor = CodeMirror(function(element) {
        body.appendChild(element);
      }, {value: content, mode: "javascript", lineWrapping: true});

      currentEditor.on("change", function() {
        clearTimeout(lintTimer);
        lintTimer = setTimeout(updateHints, 500);
        if (currentError != null && currentError.element == selectedElement) {
          currentError = null;
        }
      });
      setTimeout(updateHints, 100);
    }
    selectedElement = element;
  }
}

function showError(params) {
  var artifact = params["artifact"];
  var type = artifact[0];
  var name = artifact.substr(2);
  var element;
  switch (type) {
  case 'f':
    element = findFunction(name);
    break;
  case 'b':
    element = findBlock(name);
    break;
  case 'm':
    var cut = name.indexOf('.');
    element = findMethod(name.substr(0, cut), name.substr(cut + 1));
    break;
  }
  if (element == null) {
    window.console.log("artifact not found: " + artifact);
    currentError = null;
  } else {
    select(element);
    currentError.element = element;
  }
}

function handleClick(event) {
  var element = event.target;
//  var menuHidden = currentMenu != null;
  closeMenu();

  if (element != null && (element.localName == 'tj-operation-signature' ||
      element.localName == 'tj-class-name' || element.localName == 'tj-block-name')) {
    window.console.log("cx: ", event.clientX, " bcr.l: ", element.getBoundingClientRect().left,
      " cl: ", element.clientLeft, " cw: ", element.clientWidth);
    event.stopPropagation();
    event.preventDefault();
    if (event.clientX - element.getBoundingClientRect().left - element.clientLeft > element.clientWidth - 40) {
      openContextMenu(element);
    } else {
      select(element.parentNode);
    }
  } else {
    while (element != null) {
      var jsaction = element.getAttribute && element.getAttribute("jsaction");
      if (jsaction) {
        event.stopPropagation();
        event.preventDefault();
        handleJsaction(jsaction, element, event);
        return;
      }
      element = element.parentNode;
    }
  }
};

function setName(name) {
  currentProgramName = name;
  document.title = "TideJ" + (name.startsWith("Unnamed") ? "" : (": " + name));
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


document.onclick = handleClick;

/*
document.body.oninput = function(event) {
  if (event.target.localName == 'textarea') {
    autoresize(event.target);
  }
};*/

document.ontouchstart = function(event) {
  // window.console.log("touch start", event);
  if (event.touches.length == 1) {
    touchStartElement = event.target;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchStartTime = Date.now();
  } else {
    touchStartElement = null;
  }
  document.onclick = null;
}

document.ontouchend = function(event) {
  // window.console.log("touch end", event);
  var dt = Date.now() - touchStartTime;
  if (event.changedTouches.length >= 1 && dt < 500) {
    var t0 = event.changedTouches[0];
    var dx = t0.clientX - touchStartX;
    var dy = t0.clientY - touchStartY;
    var d2 = dx * dx + dy * dy;
    if (d2 < 256) {
      event.clientX = touchStartX;
      event.clientY = touchStartY;
      handleClick(event);
    } else {
    //  window.alert("failed click; d2: " + d2);
    }
  } else {
    // window.alert("failed click; dt: " + dt + " ctl: " + event.changedTouches.length);
  }
  touchStartElement = null;
}


var widgets = []
function updateHints() {
  var editor = currentEditor;
  if (editor == null) {
    return;
  }

  editor.operation(function(){
    for (var i = 0; i < widgets.length; ++i) {
      editor.removeLineWidget(widgets[i]);
    }
    widgets.length = 0;

    JSHINT(editor.getValue());

    var errors = JSHINT.errors.slice(0);
    if (currentError != null && currentError.element == selectedElement) {
      errors.push(currentError);
    }

    for (var i = 0; i < errors.length; ++i) {
      var err = errors[i];
      if (!err) {
        continue;
      }
      var reason = err.reason;
      if (currentError && currentError != err && reason &&
        reason.startsWith("Unrecoverable syntax error")) {
        continue;
      }

      var msg = document.createElement("div");
      var icon = msg.appendChild(document.createElement("span"));
      icon.innerHTML = "&nbsp;!&nbsp;"; // "&#215;";
      icon.className = "lint-error-icon";
      msg.appendChild(document.createTextNode(reason));
      msg.className = "lint-error";
      widgets.push(editor.addLineWidget(err.line - 1, msg, {coverGutter: false, noHScroll: true}));
    }
  });
  var info = editor.getScrollInfo();
  var after = editor.charCoords({line: editor.getCursor().line + 1, ch: 0}, "local").top;
  if (info.top + info.clientHeight < after)
    editor.scrollTo(null, after - info.clientHeight + 3);
}


window.onhashchange = load;
load();


