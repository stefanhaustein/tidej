var tidej = window.tidej = {};

tidej.runtime = {};
tidej.dom = {};

if (typeof String.prototype.startsWith != 'function') {
	// see below for better implementation!
	String.prototype.startsWith = function (str){
		return this.indexOf(str) == 0;
	};
}

tidej.dom.getChildElement = function(element, name) {
	var child = element.firstElementChild;
	while (child != null) {
		if (child.tagName.toLowerCase() == name) {
			return child;
		}
		child = child.nextElementSibling;
	}
	return null;
};

tidej.dom.findName = function(element, name) {
	var child = element.firstElementChild;
	while (child != null) {
		if (tidej.dom.getChildText(child, 'tj-name') == name) {
			return child;
		}
		child = child.nextElementSibling;
	}
	return null;
}

tidej.dom.getChildText = function(element, name) {
	var child = tidej.dom.getChildElement(element, name);
	return child == null ? '' : child.textContent;
};

tidej.runtime.buildClass = function(classElement, mode) {
	var constructorProlog = '';
	var constructorBody = '';
	var constructorParams = '';
	var members = '';
	var className = tidej.dom.getChildText(classElement, 'tj-name');

	var propertiesElement = tidej.dom.getChildElement(classElement, 'tj-properties');
	var propertyElement = propertiesElement && propertiesElement.firstElementChild;
	while (propertyElement) {
		var propertyName = tidej.dom.getChildText(propertyElement, 'tj-name');
		var positionIndicator = '// [[' + className + '.' + propertyName + ']]\n';
		var isStatic = propertyElement.classList.contains('static') || 
			propertyElement.classList.contains('const');
		var value = tidej.dom.getChildText(propertyElement, 'tj-value');
		if (value == null || value == '') {
			value = 'null';
		}
		if (isStatic) {
			members += positionIndicator + className + '.' + propertyName + ' = ' + value + ';\n';
		} else {
			constructorProlog += positionIndicator + 'this.' + propertyName + ' = ' + value + ';\n';
		}
		propertyElement = propertyElement.nextElementSibling;
	}
	
	var methodsElement = tidej.dom.getChildElement(classElement, 'tj-methods');
	var methodElement = methodsElement && methodsElement.firstChild;
	while (methodElement) {
		var methodName = tidej.dom.getChildText(methodElement, 'tj-name');
		var positionIndicator = '// [[' + className + '.' + methodName + ']]\n';
		var isStatic = methodElement.classList.contains('static');
		var params = '';
		var paramsElement = tidej.dom.getChildElement(methodElement, 'tj-params');
		var paramElement = paramsElement && paramsElement.firstElementChild;
		while (paramElement) {
			if (params != '') {
				params += ',';
			}
			params += tidej.dom.getChildText(paramElement, 'tj-name');
			paramElement = paramElement.nextElementSibling;
		}
		var body = positionIndicator + tidej.dom.getChildText(methodElement, 'tj-body') + '\n';
		if (methodName == className) {
			constructorParams = params;
			constructorBody = body;
		} else {
			members += className + (isStatic ? '.' : '.prototype.')
					+ methodName + ' = function(' + params + ') {\n'
					+ body + '}\n';
		}
		methodElement = methodElement.nextElementSibling;
	}

	return className + ' = function(' + constructorParams + ') {\n'
			+ constructorProlog + constructorBody + '}\n' + members;
}

tidej.runtime.buildProgram = function(diagramElement) {
	var code = '';
	var classElement = diagramElement.firstElementChild;
	while (classElement != null) {
		code += tidej.runtime.buildClass(classElement);
		classElement = classElement.nextElementSibling;
	}
	return code;
}

tidej.runtime.showError = function(error) {
	
	var codeLines = tidej.runtime.code.split('\n');
	var stackLines = error.stack.split('\n');
	
	var lineNumber = -1;
	for (var i = 0; i < stackLines.length; i++) {
		var line = stackLines[i];
		// Chrome:
		//  at new Test, <anonymous>:6:1)
		var cut0 = line.indexOf('<anonymous>:');
		if (cut0 != -1) {
			cut0 += 12;
			var cut1 = line.indexOf(':', cut0);
			if (cut1 != -1) {
				lineNumber = parseInt(line.substring(cut0, cut1)) - 1;
				break;
			}
		}
		// Firefox
		// Test@http://localhost:8888/run.html:6
		cut0 = line.indexOf("run.html:");
		if (cut0 != -1 && cut0 > line.length - 6) {
			cut0 += 9;
			lineNumber = parseInt(line.substring(cut0));
			break;
		}
	}
	
	if (lineNumber != -1) {
		var className = null;
		var memberName = null;
	
		for (var i = lineNumber; i >= 0; i--) {
			var line = codeLines[i];
			if (line.startsWith('// [[')) {
				console.log('source: ', codeLines[i]);
				lineNumber -= i + 1;
				var cut0 = 5;
				var cut1 = line.indexOf('.', cut0);
				var cut2 = line.indexOf(']', cut1);
				
				className = line.substring(cut0, cut1);
				memberName = line.substring(cut1 + 1, cut2);
				break;
			}
		}
		
		if (className != null) {
			tidej.runtime.editor.showError(className, memberName, lineNumber, error.message);
			return;
		}
	}
	throw error;
}


tidej.runtime.parseParams = function(s) {
	var parts = s.split(';');
	var result = {};
	for (var i = 0; i < parts.length; i++) {
		var part = parts[i];
		var cut = part.indexOf('=');
		if (cut != -1) {
			result[part.substr(0, cut)] = part.substr(cut + 1);
		}
	}
	return result;
}

tidej.runtime.params = function() {
	var hash = window.location.hash;
	if (hash == null) {
		return {};
	}
	if (hash.length > 0 && hash.charAt(0) == '#') {
		hash = hash.substring(1);
	}
	return tidej.runtime.parseParams(hash);
}

tidej.runtime.getStorageId = function() {
	return tidej.runtime.params()['id'];
}

tidej.runtime.load = function(callback) {
	var params = tidej.runtime.params();
	var id = params['id'];
	if (id == null) {
		return;
	}
	var path = "storage?id=" + id;
	var rev = params['rev'];
	if (rev != null) {
		path += "&rev=" + rev;
	} else {
		path += "&cache-poison=" + Math.random();
	}
	xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", path, true);
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			var rawContent = xmlhttp.responseText;
			var cut = rawContent.indexOf('\n');
			var meta = tidej.runtime.parseParams(rawContent.substr(0, cut));
			var content = rawContent.substr(cut + 1);
			console.log("raw:", rawContent, "content", content, "meta:", meta);
			if (callback) {
				callback(content, meta);
			}
		}
	}
	xmlhttp.send();
}


tidej.runtime.run = function(content, editor) {
	tidej.runtime.editor = editor;
	var diagramElement = document.createElement('div');
	diagramElement.innerHTML = content;
	
	var applicationElement = diagramElement.getElementsByClassName('application')[0];
	console.log('application element:', applicationElement);
	var appName = tidej.dom.getChildText(applicationElement, 'tj-name');
	
	var code = tidej.runtime.buildProgram(diagramElement);
	
	code = code + '\n' +
		'var application = new ' + appName + '();\n' +
		'window.bildschirm.starteApplikation(application);\n' +

	console.log('program code with start code: ', code);

	if (editor != null) {
		code = 'try {\n' + code +
		'\n} catch(e) {\n' + 
		'  tidej.runtime.showError(e);\n' + 
		'}\n';
	};

	console.log('program code to be evaluated: ', code);

	tidej.runtime.code = code;
	//eval(code);
	
	var scriptElement = document.getElementById('application');
	if (scriptElement != null) {
		scriptElement.parent.removeChild(scriptElement);
	}	
	scriptElement = document.createElement('script');
	scriptElement.setAttribute('id', 'application');
	scriptElement.textContent = code;
	var body = document.getElementsByTagName('body')[0];
	body.appendChild(scriptElement);
};


