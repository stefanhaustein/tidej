var state = {
    currentProperty: null,
    currentClass: null
};

function addClass(x, y) {
    var newClass = $("#templates tj-class").get(0).cloneNode(true);
    $(newClass).draggable(); // 
    newClass.style.position = "absolute";
    newClass.style.top = y + "px";
    newClass.style.left = x + "px";
    openClassDialog(newClass);
}

function addProperty(classElement) {
    var newProperty = $("#templates tj-property").get(0).cloneNode(true);
    openPropertyDialog(newProperty);
}

function addMethod(classElement) {
    var newMethod = $("#templates tj-method").get(0).cloneNode(true);
    openMethodDialog(newMethod);
}

function openClassDialog(classElement) {
    state.currentClass = classElement;
    var q = $(classElement);
    $("#class-dialog-name").val(q.children("tj-name").text());
    $("#class-dialog").dialog('open');
}

function openPropertyDialog(propertyElement) {
    state.currentProperty = propertyElement;
    var q = $(propertyElement);
    $("#property-dialog-name").val(q.children("tj-name").text());
    $("#property-dialog-type").val(q.children("tj-type").text());
    $("#property-dialog-static").val(q.hasClass("static"));
    $("#property-dialog").dialog('open');
}

function openMethodDialog(methodElement) {
    state.currentMethod = methodElement;
    var q = $(methodElement);
    $("#method-dialog-name").val(q.children("tj-name").text());
    $("#method-dialog-type").val(q.children("tj-type").text());
    $("#method-dialog-body").text(q.children("tj-body").text());
    $("#method-dialog-static").val(q.hasClass("static"));

    var tbody = $("#method-dialog-params");
    tbody.empty();
    var n = 1;
    q.find("tj-param").each(function() {
        tbody.append("<tr class='horizontal'>" +
            "<th>Par." + n++ + ":" +
            "<td><input value='" + $(this).children("tj-name").text() + "'></input></td>" +
            "<td><input value='" + $(this).children("tj-type").text() + "'></input></td>" +
            "</tr>");
    });

    $("#method-dialog").dialog('open');
}

function saveClass() {
    var q = $(state.currentClass);
    q.children("tj-name").text($("#class-dialog-name").val());
    if (state.currentClass.parentNode == null) {
        document.getElementById("diagram").appendChild(state.currentClass);
    }
    loadClass(state.currentClass);
}

function saveProperty() {
    var q = $(state.currentProperty);
    q.children("tj-name").text($("#property-dialog-name").val());
    q.children("tj-type").text($("#property-dialog-type").val());
    if ($("#property-dialog-static").is(':checked')) {
        q.addClass("static");
    } else {
        q.removeClass("static");
    }
    
    if (state.currentProperty.parentNode == null) {
        $(state.currentClass).children("tj-properties").get(0).appendChild(state.currentProperty);
    }
}

function saveMethod() {
    var q = $(state.currentMethod);
    q.children("tj-name").text($("#method-dialog-name").val());
    q.children("tj-type").text($("#method-dialog-type").val());
    q.children("tj-body").text($("#method-dialog-body").val());
    
    if ($("#method-dialog-static").is(':checked')) {
        q.addClass("static");
    } else {
        q.removeClass("static");
    }
    
    if (state.currentMethod.parentNode == null) {
        $(state.currentClass).children("tj-methods").get(0).appendChild(state.currentMethod);
    }
}

$("tj-class").draggable();

$("#property-dialog").dialog({
    autoOpen: false,
    buttons: {
        'Cancel': function() {
            $("#property-dialog").dialog('close');
        },
        'Save': function() {
            saveProperty();
            $("#property-dialog").dialog('close');
        }
    }
});

$("#method-dialog").dialog({
    autoOpen: false,
    buttons: {
        'Cancel': function() {
            $("#method-dialog").dialog('close');
        },
        'Save': function() {
            saveMethod();
            $("#method-dialog").dialog('close');
        }
    }
});


$("#class-dialog").dialog({
    autoOpen: false,
    modal: true,
    buttons: {
        'Add Property': function(event) {
            saveClass();
            $(this).dialog("close");
            addProperty(state.currentClass);
        },
        'Add Method': function(event) {
            saveClass();
            $(this).dialog("close");
            addMethod(state.currentClass);
        },
        'Delete': function(event) {
            var parent = state.currentClass.parentNode;
            if (parent != null) {
                parent.removeChild(state.currentClass);
            }
            $(this).dialog("close");
        },
        'Cancel': function() {
            $(this).dialog("close");
        },
        'Save': function() {
            saveClass();
            $(this).dialog("close");
        }
    }
});



$("body").click(function (event) {
    var element = event.target;
    while (element != null) {
        var name = element.tagName;
        if (name != null) {
            if (element.id == 'class-dialog') {
                return;
            }
            name = name.toLowerCase();

            if (name == "tj-property") {
                openPropertyDialog(element);
                return;
            } 
            if (name == "tj-method") {
                openMethodDialog(element);
                return;
            } 
            if (name == "tj-class") {
                openClassDialog(element);
                return;
            } 
            console.log(event.target.tagName);
        }
        
        element = element.parentNode;
    }
    
    if (event.target == document.getElementById('diagram')) {
      addClass(event.clientX, event.clientY);
    }  
    // No element found.  
    
});