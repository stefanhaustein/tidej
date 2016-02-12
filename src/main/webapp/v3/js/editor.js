var selectedOperation = null;
var selectedClass = null;
var selectedElement = null;
var currentMenu = null;
var currentProgramName = "";

var currentId;
var currentSecret;

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
 '<tj-block><tj-block-name>Program body</tj-block-name><tj-block-body><textarea></textarea></tj-block-body>' +
 '</tj-section-body>' +
 '</tj-section>';
 

function save(callback) {
  var textAreas = document.body.querySelectorAll('textarea');
  for (var i = 0; i < textAreas.length; i++) {
    textAreas[i].textContent = textAreas[i].value;
  }

  var selected = selectedElement;
  select(null);
  var program = document.body.querySelector('tj-program').innerHTML;
  select(selectedElement);

  if (program == savedContent) {
    callback();
  } else {
    modal.show("Saving...");
    io.saveContent(program, {id: currentId, secret: currentSecret}, function(params) {

      modal.hide();
      savedContent = program;
      currentId = params['id'];
      currentSecret = params['secret'];

      location.hash = "#id=" + newId + ";secret=" + newSecret;

      programList[currentProgramName] = {id: newId, secret: newSecret};
      localStorage.setItem('programList', JSON.stringify(programList));
      if (callback != null) {
        callback();
      }
    });
  }
}

function closeMenu() {
  if (currentMenu) {
    currentMenu.style.display = "none";
    currentMenu = null;
  }
}

function openMenu(id) {
  closeMenu();
  currentMenu = document.getElementById(id);
  currentMenu.style.display = "block";
}

function addClass(name) {
  if (!name) {
    return;
  }

  var classesBlock = document.getElementById("classes").querySelector("tj-section-body");
  var classElement = classesBlock.firstElementChild;
  while (classElement != null) {
    var className = classElement.querySelector("tj-class-name").textContent;
    if (className > name) {
      break;
    }
    classElement = classElement.nextElementSibling;
  }
  var newElement = document.createElement("tj-class");
  newElement.innerHTML = "<tj-class-name></tj-class-name><tj-class-body><tj-operation>" +
      "<tj-operation-signature>constructor()</tj-operation-signature>" +
      "<tj-operation-body><textarea></textarea></tj-operation-body>"+
      "</tj-operation></tj-class-body>";
  classesBlock.insertBefore(newElement, classElement);
  newElement.querySelector("tj-class-name").textContent = name;
  select(newElement);
}

function addFunction(name) {
  if (!name) {
    return;
  }
  if (name.indexOf('(') == -1) {
    name += "()";
  }
  var functionsBlock = document.getElementById("functions").querySelector("tj-section-body");
  var opElement = functionsBlock.firstElementChild;
  while (opElement != null) {
    var opName = opElement.querySelector("tj-operation-signature").textContent;
    if (opName > name) {
      break;
    }
    opElement = opElement.nextElementSibling;
  }
  var newElement = document.createElement("tj-operation");
  newElement.innerHTML = "<tj-operation-signature></tj-operation-signature><tj-operation-body><textarea></textarea></tj-operation-body>";
  functionsBlock.insertBefore(newElement, opElement);
  newElement.querySelector("tj-operation-signature").textContent = name;
  select(newElement);
}

function handleJsaction(name, element, event) {
  switch(name) {
    case 'add-class':
      modal.prompt("Class name?", "", addClass);
      break;

    case 'add-function':
      modal.prompt("Function name or signature?", "", addFunction);
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
         window.location = "run.html#id=" + currentId;
      });
      break;
  }  
}

  
function autoresize(ta) {
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight+'px';
  ta.scrollTop = ta.scrollHeight;
  window.scrollTo(window.scrollLeft,(ta.scrollTop + ta.scrollHeight));
}
  
  
function select(element) {
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
      var ta = selectedOperation.querySelectorAll('textarea');
      window.console.log(ta);
      for (var i = 0; i < ta.length; i++) {
        autoresize(ta[i]);
      }
    }
    selectedElement = element;
  }
}
  
  
document.body.oninput = function(event) {
  if (event.target.localName == 'textarea') {
    autoresize(event.target);
  }
};
  
  
document.onclick = function(event) {
  var element = event.target;
  var menuHidden = currentMenu != null;
  closeMenu();

  while (element != null && 
      element.localName != 'tj-operation-signature' && 
      element.localName != 'tj-class-name' &&
      element.localName != 'tj-block-name') {
    var jsaction = element.getAttribute && element.getAttribute("jsaction");
    if (jsaction) {
      handleJsaction(jsaction, element, event);
      return;
    }
    element = element.parentNode;
  }

  if (element != null) {
    select(element.parentNode);
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
    modal.show("Loading...");
    io.loadContent({id: currentId}, function(programXml) {
      modal.hide();
      programElement.innerHTML = programXml;
      savedContent = programElement.innerHTML;
      var programNameElement = programElement.querySelector("tj-program-name");
      setName(programNameElement == null ? "" + currentId : programNameElement.textContent);
    });
  }
}

window.onhashchange = load;
load();


