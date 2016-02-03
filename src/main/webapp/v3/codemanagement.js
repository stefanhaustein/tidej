
function buildOperation(operationElement, className) {
  var signature = operationElement.querySelector('tj-signature').textContent;
  var body = operationElement.querySelector('tj-body').textContent;
  
  var prefix;
  if (className) {
    var cut = signature.indexOf('(');
    if (signature.startsWith("constructor")) {
      prefix = "function " + className + signature.substr(cut);
    } else {
      prefix = className + ".prototype." + signature.substr(0, cut) + " = function" + signature.substr(cut);
    }
  } else if (signature == "Constants" || signature == "Globals" || signature == "Main program") {
      return body;
  } else {
    prefix = 'function ' + signature;
  }
  
  return prefix + '{\n' + body + '\n}\n';
} 

function buildClass(classElement) {
  var className = classElement.querySelector('tj-signature').textContent;
  var body = classElement.querySelector('tj-body');
  return buildCode(body, className);
}

function buildCode(rootElement, className) {
  var result = '';
  var element = rootElement.firstElementChild;
  while (element != null) {
    switch (element.localName) {
    case 'tj-operation':
      result += buildOperation(element, className);
      break;
    case 'tj-class':
      if (className) {
        throw new Error("Nested class!");
      }
      result += buildClass(element);
      break;
    } 
    element = element.nextElementSibling;
  }
  return result;
}