// Not currently in Use, see buildClass in base.js

tidej.runtime.loadClass = function(classElement) {
	var classQuery = $(classElement);
	var className = classQuery.children("tj-name").text();
	var methodsQuery = classQuery.find("tj-method");
	var propertiesQuery = classQuery.find("tj-property");
	var methods = {};
	var staticMembers = {};
	var constructorDef = [ "" ];

	console.log('buildClass output: ', tidej.runtime.buildClass(classElement));

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
			f.name = className + "." + methodName;
			if (methodQuery.hasClass("static")) {
				staticMembers[methodName] = f;
			} else {
				methods[methodName] = f;
			}
		}
	});

	var epilog = "";
	propertiesQuery
			.each(function() {
				var propertyQuery = $(this);
				var propertyName = propertyQuery.children("tj-name").text();
				var propertyValue = propertyQuery.children('tj-value').text();
				var hasValue = propertyValue != null && propertyValue != '';
				if (propertyQuery.hasClass('static')
						|| propertyQuery.hasClass('const')) {
					var value = hasValue ? eval(propertyValue) : null;
					staticMembers[propertyName] = value;
				} else {
					epilog += "this." + propertyName + " = "
							+ (hasValue ? propertyValue : "null") + ";\n";
				}
			});
	constructorDef[constructorDef.length - 1] = epilog
			+ constructorDef[constructorDef.length - 1];

	var constructor = window[className] = Function.apply(null, constructorDef);
	constructor.name = className + "." + className;
	constructor.myName = className + "." + className;

	for ( var name in methods) {
		constructor.prototype[name] = methods[name];
	}
	for ( var name in staticMembers) {
		constructor[name] = staticMembers[name];
	}
	return constructor;
} 
