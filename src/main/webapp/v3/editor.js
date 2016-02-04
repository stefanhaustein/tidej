var selectedOperation = null;
var selectedClass = null;
var menuVisible = false;
var currentProgramName = "Planets";

var EMPTY_PROGRAM = 
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
 


function save() {
  var textAreas = document.body.querySelectorAll('textarea');
  for (var i = 0; i < textAreas.length; i++) {
    textAreas[i].textContent = textAreas[i].value;
  }
  
  var program = document.body.querySelector('tj-program').innerHTML;
  localStorage.setItem("currentProgramName", currentProgramName);
  localStorage.setItem("program-" + currentProgramName, program);
}
  
function run() {
  save();
  window.location = "run.html";
}
  

function handleJsaction(name, element, event) {
  switch(name) {
    case "showMenu":
      document.getElementById("menu").style.display="";
      menuVisible = true;
      break;

    case 'constants':
    case 'globals':
      select(document.getElementById(name));
      break;

    case 'new-program':
      var newName = window.prompt("Program name");
      if (newName.trim() != "") {
        currentProgramName = newName;
        var xml = localStorage.getItem("program-" + currentProgramName);
        if (xml == null) {
          xml = EMPTY_PROGRAM;
        }
        selectedOperation = null;
        selectedClass = null;
        document.body.querySelector('tj-program').innerHTML = xml;
        document.getElementById('title').textContent = newName;
      }
      break;

    case 'delete-program':
      selectedOperation = null;
      selectedClass = null;
      document.body.querySelector('tj-program').innerHTML = EMPTY_PROGRAM;
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
    selectedOperation.className = '';
    selectedOperation = null;
  } else if (element == selectedClass) {
    selectedClass.className = '';
    selectedClass = null;
  } else {
    element.className = 'selected';
    if (element.localName == 'tj-class') {
      selectedClass = element;
    } else {
      selectedOperation = element;
      if (selectedClass != null && selectedClass != element.parentNode.parentNode) {
        selectedClass.className = '';
        selectedClass = null;
      }
      var ta = selectedOperation.querySelectorAll('textarea');
      window.console.log(ta);
      for (var i = 0; i < ta.length; i++) {
        autoresize(ta[i]);
      }
    }
  }
}
  
document.body.oninput = function(event) {
  if (event.target.localName == 'textarea') {
    autoresize(event.target);
  }
};
  
  
  
document.body.onclick = function(event) {
  var element = event.target;
  var menuHidden = menuVisible;
  
  if (menuVisible) {
    document.getElementById('menu').style.display = "none";
    menuVisible = false;
  }

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
    
