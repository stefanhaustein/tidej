function countLines(code) {
  var count = 0;
  var pos = 0;
  while (true) {
    pos = code.indexOf('\n', pos) + 1;
    if (pos == 0) {
      break;
    }
    count++;
  }
  return count;
}

function buildOperation(map, line, operationElement, className) {
  var signature = operationElement.querySelector('tj-operation-signature').textContent;
  var body = operationElement.querySelector('tj-operation-body').textContent;
  var prefix;
  if (className) {
    map[line] = "m:" + className + "." + signature;
    var cut = signature.indexOf('(');
    if (signature.startsWith("constructor")) {
      prefix = "function " + className + signature.substr(cut);
    } else {
      prefix = className + ".prototype." + signature.substr(0, cut) + " = function" + signature.substr(cut);
    }
  } else {
    map[line] = "f:" + signature;
    prefix = 'function ' + signature;
  }
  return prefix + '{\n' + body + '\n}\n\n';
} 

function buildClass(map, line, classElement) {
  var className = classElement.querySelector('tj-class-name').textContent;
  var body = classElement.querySelector('tj-class-body');
  map[line] = className;
  return buildCode(map, line, body, className);
}

function buildCode(map, line, rootElement, className) {
  var element = rootElement.firstElementChild;
  var result = '';
  while (element != null) {
    var code = '';
    switch (element.localName) {
    case 'tj-block':
      map[line] = "b:" + element.querySelector('tj-block-name').textContent;
      code = element.querySelector('tj-block-body').textContent + "\n";
      break;
      
    case 'tj-operation':
      code = buildOperation(map, line, element, className);
      break;
      
    case 'tj-class':
      if (className) {
        throw new Error("Nested class!");
      }
      code = buildClass(map, line, element); 
      break;
      
    default:
      code = buildCode(map, line, element, className);
    } 
    element = element.nextElementSibling;
    line += countLines(code);
    result += code;
  }
  return result;
}
