
function buildOperation(operationElement, className) {
  var signature = operationElement.querySelector('tj-operation-signature').textContent;
  var body = operationElement.querySelector('tj-operation-body').textContent;
  
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
  var className = classElement.querySelector('tj-class-name').textContent;
  var body = classElement.querySelector('tj-class-body');
  return buildCode(body, className);
}

function buildCode(rootElement, className) {
  var result = '';
  var element = rootElement.firstElementChild;
  while (element != null) {
    switch (element.localName) {
    case 'tj-block':
      result += element.querySelector('tj-block-body').textContent;
      break;
    case 'tj-operation':
      result += buildOperation(element, className);
      break;
    case 'tj-class':
      if (className) {
        throw new Error("Nested class!");
      }
      result += buildClass(element);
      break;
    default:
      result += buildCode(element, className);
    } 
    element = element.nextElementSibling;
  }
  return result;
}