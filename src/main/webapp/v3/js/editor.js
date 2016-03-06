var selectedOperation = null;
var selectedClass = null;
var selectedElement = null;

var current = {};
var currentMenu = null;
var currentEditor = null;
var currentError = null;
var currentContent = null;
var currentContentDirty = false;

var programListText = localStorage.getItem('programList');
var programList = programListText == null ? {} : JSON.parse(programListText);

var savedContent = {dev: null, local: null, pub: null};

var widgets = []

var SaveOptions = {
  FORCE: 1,
  PUBLISH: 2,
  BACKGROUND: 4
};


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
// '<tj-section-name>Values</tj-section-name>' +
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

    var parentMenuId = currentMenu.getAttribute("data-parent-menu");
    if (parentMenuId) {
      document.getElementById(parentMenuId).style.display = "none";
    }

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

function generateId() {
  return "local-" + ~~(Math.random() * 1000000);
}

function getCurrentContent() {
  if (currentContentDirty) {
    if (currentEditor != null) {
      var selected = selectedElement;
      select(null);
      currentContent = document.getElementById('program').innerHTML;
      select(selected);
    } else {
      currentContent = document.getElementById('program').innerHTML;
    }
    currentContentDirty = false;
  }
  return currentContent;
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

    case 'add-method':
      modal.prompt("Method name or signature?", "", function(name) {
        var container = currentAnchorElement.parentNode.querySelector("tj-class-body");
        addFunction(name, container);
      });
      break;

    case 'change-signature':
    case 'rename-class':
      var oldName = currentAnchorElement.textContent;
      modal.prompt(name == "rename-class" ? "New name: " : "New signature:", oldName, function(newName) {
            if (newName != oldName) {
              currentAnchorElement.textContent = newName;
              var artifact = currentAnchorElement.parentNode;
              var container = artifact.parentNode;
              container.removeChild(artifact);
              insertArtifact(container, artifact);
            }
          });
      break;

    case 'clear-block':
      var blockName = currentAnchorElement.textContent;
      modal.confirm("Clear " + modal.htmlEscape(blockName) + "?", function(ok) {
        if (ok) {
          var artifact = currentAnchorElement.parentNode;
          if (artifact == selectedElement) {
            select(null);
          }
          var body = artifact.querySelector("tj-block-body");
          body.innerHTML = "";
          if (blockName != "Program body") {
            artifact.style.display = "none";
          }
          cleanup();
        }
      });
      break;

    case 'delete-artifact':
      var artifactName = currentAnchorElement.textContent;
      modal.confirm("Delete " + modal.htmlEscape(artifactName) + "?", function(ok) {
        if (ok) {
          var artifact = currentAnchorElement.parentNode;
          if (artifact == selectedElement) {
            select(null);
          }
          var container = artifact.parentNode;
          container.removeChild(artifact);
          cleanup();
        }
      });
      break;


    case 'load':
      var id = element.getAttribute("data-id");
      load("#id=" + id);
      break;

    case 'load-dialog':
      var options = [];
      for (var id in programList) {
        var entry = programList[id];
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

      modal.choice("Load program", options, function(id) {
        if (id != null) {
          var entry = programList[id];
          var hash = "#id=" + id;
          if (entry != null && entry.secret != null) {
            hash += ';secret=' + entry.secret
          }
          load(hash);
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

    case 'delete':
      modal.confirm('Delete program "' + modal.htmlEscape(current.name) + '"?', function(ok) {
        if (ok) {
          delete programList[current.id];
          current = {};
          saveProgramList();
          localStorage.setItem("lastHash", "");
          load("#");
        }
      });
      break;

    case "show-collaboration-url":
      save(function() {
        modal.prompt("<b>DANGER</b> &mdash; anybody with this URL can edit this program:", window.location.href);
      }, false);
      break;

    case "show-run-url":
      save(function() {
        var url = window.location.href;
        var cut = url.lastIndexOf('/');
        var runUrl = url.substr(0, cut + 1) + "run.html#id=" + current.id;
        modal.prompt("Share this URL:", runUrl);
      }, true);
      break;

    case 'new-program':
      localStorage.setItem("lastHash", "");
      load("#");
      break;

    case 'rename':
      modal.prompt("New Program Name?", current.name, function(newName) {
        if (newName && newName != current.name) {
          setName(newName);
          save();
        }
      });
      break;

    case 'run':
      save();
      window.location = "run.html#id=" + modal.htmlEscape(current.id) +
        (current.secret == null ? "" : (";secret=" + modal.htmlEscape(current.secret)));
      break;
  }  
}

function setProgram(content) {
  var programElement = document.getElementById("program");
  programElement.innerHTML = content;
  currentProgram = programElement.innerHTML;
  currentProgramDirty = false;

  var programNameElement = programElement.querySelector("tj-program-name");
  setName(programNameElement == null ? "" + current.id : programNameElement.textContent);

  var errorString = localStorage.getItem("tidej.error");
  if (errorString && errorString != "null") {
    localStorage.removeItem("tidej.error");
    currentError = JSON.parse(errorString);
    showError(currentError);
  }
}

function load(hash) {
   if (hash != null && ("" + hash).startsWith("#")) {
     // This will trigger a url change event, which will call load...
     window.location.replace(hash);
     return;
   }
   hash = window.location.hash;
   if (hash.length > 1) {
     localStorage.setItem("lastHash", hash);
   } else if (localStorage.getItem("lastHash")) {
     hash = localStorage.getItem("lastHash");
   }
   var params = io.parseParams(hash.substr(1));

   current = {
     id: params['id'],
     secret: params['secret']
   }

   selectedOperation = null;
   selectedClass = null;
   savedContent = {};

   if (current.id == null) {
     setProgram(EMPTY_PROGRAM_INNER);
     savedContent.local = currentContent;
     current.forkedFrom = current.id;
   } else {
     // Check if we have this locally
     if (current.secret == null) {
       var localProgram = localStorage.getItem("program-" + current.id);
       if (localProgram != null) {
         setProgram(localProgram);
         savedContent = {local: currentContent};
         return;
       }
     }
     modal.showDeferred("Loading...");
     io.loadContent({id: current.id, tag: current.secret == null ? 'pub' : 'dev'}, function(programXml) {
       modal.hide();
       setProgram(programXml);
       if (current.secret != null) {
         savedContent.dev = currentContent;
       } else {
         current.forkedFrom = current.id;
         savedContent.local = currentContent;
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

function showContextMenu(anchorElement, menuId) {
  closeMenu();
  currentAnchorElement = anchorElement;
  currentMenu = document.getElementById(menuId);
  var pos = modal.getDocumentPosition(anchorElement);
  currentMenu.style.right = pos.x + "px";
  currentMenu.style.top = pos.y + anchorElement.offsetHeight / 2 + "px";
  currentMenu.style.position = "absolute";
  currentMenu.style.display = "block";
}

function openContextMenu(element) {
  var elementName = element.localName;
  if (elementName == "tj-operation-signature") {
    showContextMenu(element, isConstructor(element.parentNode) ?
       "constructor-context-menu" : "operation-context-menu");
  } else if (elementName == "tj-class-name") {
    showContextMenu(element, "class-context-menu");
  } else if (elementName == "tj-block-name") {
    showContextMenu(element, "block-context-menu");
  }
}

function openMenu(id) {
  closeMenu();
  currentMenu = document.getElementById(id);
  currentMenu.style.display = "block";

  var parentMenuId = currentMenu.getAttribute("data-parent-menu");
  if (parentMenuId) {
    var parentMenu = document.getElementById(parentMenuId);
    parentMenu.style.display = "block";
  }
}

// Setting a callback forces remote saving
function save(callback, publish) {
  if (getCurrentContent() != savedContent.local) {
    if (current.id == current.forkedFrom) {
      current.id = generateId();
      if (current.forkedFrom != null) {
        setName(current.name +  " (fork)");
      }
      saveProgramList();
      window.onhashchange = null;
      window.location.replace("#id=" + current.id);
      localStorage.setItem("lastHash", window.location.hash)
      window.onhashchange = load;
    }
    localStorage.setItem("program-" + current.id, getCurrentContent());
    savedContent.local = getCurrentContent();
  }

  // Even if we don's save anything, we update the time stamp for run().
  if (current.id != null && current.id != current.forkedFrom) {
    localStorage.setItem("lastSaved", JSON.stringify({
      id: current.id,
      timeStamp: Date.now()}));
  }
  var tag = publish ? 'pub' : 'dev';

  // No need to save if
  // - this is not a sharing request and we haven't saved remotely before
  // - if the content did not change
  if ((callback == null && current.secret == null) ||
      savedContent[tag] == getCurrentContent()) {
    if (callback != null) {
      callback();
    }
    return;
  }

  var oldCurrent = current;
  var oldHash = window.location.hash;
  if (callback != null) {
    modal.showDeferred("Saving...");
  }
  io.saveContent(getCurrentContent(), {
      id: current.id,
      secret: current.secret,
      name: current.name,
      tag: tag}, function(params) {
    savedContent[tag] = getCurrentContent();

    oldCurrent.id = params['id'];
    oldCurrent.secret = params['secret'];

    var newHash = "#id=" + oldCurrent.id + ";secret=" + oldCurrent.secret;
    // Changed and nothing else loaded in the meantime?
    if (oldHash != newHash && window.location.hash == oldHash) {
      window.onhashchange = null;
      location.replace(newHash);
      window.onhashchange = load;
    }
    saveProgramList();
    if (callback != null) {
      modal.hide();
      callback();
    }
  });
}

function saveProgramList() {
  if (current.secret != null || (current.id != current.forkedFrom)) {
    programList[current.id] = current;
  }
  localStorage.setItem('programList', JSON.stringify(programList));
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

  // If we select a method from a different class, select the class first.
  if (element.parentNode.localName == 'tj-class-body' &&
    element.parentNode.parentNode != selectedClass) {
    select(element.parentNode.parentNode);
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

      var content = body.textContent;
      body.innerHTML = '';
      currentEditor = CodeMirror(function(element) {
        body.appendChild(element);
      }, {value: content, mode: 'javascript', lineWrapping: true});

      currentEditor.on('change', function() {
        clearTimeout(lintTimer);
        currentContentDirty = true;
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
  var artifact = params['artifact'];
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
    window.console.log('artifact not found: ' + artifact);
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
    event.stopPropagation();
    event.preventDefault();
    if (event.clientX - element.getBoundingClientRect().left - element.clientLeft > element.clientWidth - 40) {
      openContextMenu(element);
    } else {
      select(element.parentNode);
    }
  } else {
    while (element != null) {
      var jsaction = element.getAttribute && element.getAttribute('jsaction');
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
  currentContentDirty = name != current.name;
  current.name = name;
  var title = name;
  var unnamed = name == 'Unnamed';
  document.title = unnamed ? 'Tidej' : ('Tidej: ' + title);
  document.getElementById('title').innerHTML = (unnamed ? 'Tidej' : modal.htmlEscape(title));
  var programNameElement = document.body.querySelector('tj-program-name');
  if (programNameElement == null) {
    programElement = document.body.querySelector('tj-program');
    programNameElement = document.createElement('tj-program-name');
    programElement.insertBefore(programNameElement, programElement.firstChild);
  }
  programNameElement.textContent = name;
  saveProgramList();
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
  // window.console.log('touch start', event);
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
  // window.console.log('touch end', event);
  var dt = Date.now() - touchStartTime;
  if (event.changedTouches.length >= 1 && dt < 500) {
    var t0 = event.changedTouches[0];
    var dx = t0.clientX - touchStartX;
    var dy = t0.clientY - touchStartY;
    var d2 = dx * dx + dy * dy;
    if (d2 < 4096) {
      event.clientX = touchStartX;
      event.clientY = touchStartY;
      handleClick(event);
    } else {
    //  window.alert('failed click; d2: ' + d2);
    }
  } else {
    // window.alert('failed click; dt: ' + dt + ' ctl: ' + event.changedTouches.length);
  }
  touchStartElement = null;
}


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
        reason.startsWith('Unrecoverable syntax error')) {
        continue;
      }

      var msg = document.createElement('div');
      var icon = msg.appendChild(document.createElement('span'));
      icon.innerHTML = '&nbsp;!&nbsp;'; // '&#215;';
      icon.className = 'lint-error-icon';
      msg.appendChild(document.createTextNode(reason));
      msg.className = 'lint-error';
      widgets.push(editor.addLineWidget(err.line - 1, msg, {coverGutter: false, noHScroll: true}));
    }
  });
  var info = editor.getScrollInfo();
  var after = editor.charCoords({line: editor.getCursor().line + 1, ch: 0}, 'local').top;
  if (info.top + info.clientHeight < after)
    editor.scrollTo(null, after - info.clientHeight + 3);
}

window.onhashchange = load;
load();


