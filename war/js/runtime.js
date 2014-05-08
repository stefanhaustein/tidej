var tidej = window.tidej = {};

tidej.runtime = {};

tidej.runtime.loadClass = function(classElement) {
    var classQuery = $(classElement);
    var className = classQuery.children("tj-name").text();
    var methodsQuery = classQuery.find("tj-method");
    var propertiesQuery = classQuery.find("tj-property");
    var methods = {};
    var staticMembers = {};
    var constructorDef = [""];
    
    methodsQuery.each(function() {
        var methodQuery = $(this);
        var methodName = methodQuery.children("tj-name").text();
        var param = [];
        methodQuery.find("tj-param").each(function() {
            param.push($(this).children("tj-name").text());
        });
        param.push(methodQuery.children("tj-body").text());
        console.log("method", methodName, param);
        
        if (methodName == className) {
            constructorDef = param;
        } else {
            var f = Function.apply(null, param);
        	if (methodQuery.hasClass("static")) {
        		staticMembers[methodName] = f;
        	} else {
        		methods[methodName] = f;
        	}
        }
    });
    
    var epilog = "";
    propertiesQuery.each(function() {
        var propertyQuery = $(this);
        var propertyName = propertyQuery.children("tj-name").text();
        var propertyValue = propertyQuery.children('tj-value').text();
        var hasValue = propertyValue != null && propertyValue != '';
        if (propertyQuery.hasClass('static') || propertyQuery.hasClass('const')) {
            var value = hasValue ? eval(propertyValue) : null;
        	staticMembers[propertyName] = value;
        } else {
        	epilog += "this." + propertyName + " = " + (hasValue ? propertyValue : "null") + ";\n";
        }
    });
    constructorDef[constructorDef.length - 1] = epilog + constructorDef[constructorDef.length - 1];
    
    var constructor = window[className] = Function.apply(null, constructorDef);
    
    console.log("constructor", constructor);
    
    for (var name in methods) {
        constructor.prototype[name] = methods[name];
        console.log("added method: " + methods[name]);
    }
    for (var name in staticMembers) {
        constructor[name] = staticMembers[name];
        console.log("added static member: " + staticMembers[name]);
    }
    return constructor;
}

tidej.runtime.parseParams = function(s) {
	var parts = s.split(';');
	var result = {};
	for (var i = 0; i < parts.length; i++) {
		var part = parts[i];
		var cut = part.indexOf('=');
		if (cut != -1) {
			result[part.substr(0,cut)] = part.substr(cut + 1);
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

function getStorageId() {
	return tidej.runtime.params()['id'];
}


function load(callback) {
	var params = tidej.runtime.params();
	var id = params['id'];
	if (id == null) {
		return;
	}
	var path = "storage?id=" + id;
	var rev = params['rev'];
	if (rev != null){
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
