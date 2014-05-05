var tidej = window.tidej = {};

tidej.runtime = {};

tidej.runtime.loadClass = function(classElement) {
    var classQuery = $(classElement);
    var className = classQuery.children("tj-name").text();
    var methodsQuery = classQuery.find("tj-method");
    var methods = {};
    var staticMethods = {};
    var constructor = null;
    methodsQuery.each(function() {
        var methodQuery = $(this);
        var methodName = methodQuery.children("tj-name").text();
        var param = [];
        methodQuery.find("tj-param").each(function() {
            param.push($(this).children("tj-name").text());
        });
        param.push(methodQuery.children("tj-body").text());
        console.log("method", methodName, param);
        
        var f = Function.apply(null, param);
        if (methodName == className) {
            constructor = f;
        } else if (methodQuery.hasClass("static")) {
            staticMethods[methodName] = f;
        } else {
            methods[methodName] = f;
        }
    });
    
    if (constructor == null) {
        constructor = Function.apply(null, [""]);
    }
    window[className] = constructor;
    
    console.log("constructor", constructor);
    
    for (var name in methods) {
        constructor.prototype[name] = methods[name];
        console.log("added method: " + methods[name]);
    }
    for (var name in staticMethods) {
        constructor[name] = staticMethods[name];
        console.log("added static method: " + methods[name]);
    }
    return constructor;
}