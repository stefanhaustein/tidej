var selectedOperation = null;
var selectedClass = null;
  
function run() {
  var iframe = document.getElementById("run");
  iframe.style.display="block";
  document.getElementById("editor").style.display="none";
  iframe.contentWindow.run(buildCode(document.querySelector('tj-program')));
}
  
function autoresize(ta) {
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight+'px';
  ta.scrollTop = ta.scrollHeight;
  window.scrollTo(window.scrollLeft,(ta.scrollTop+ta.scrollHeight));
}
  
function select(element) {
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
}
  
  
document.body.onclick = function(event) {
  var element = event.target;
      
  while (element != null && element.localName != 'tj-signature') {
    element = element.parentNode;
  }

  if (element != null) {
    select(element.parentNode);
  }
}    
    
