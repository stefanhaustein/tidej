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
    $("#property-dialog").dialog('open');
}

function openMethodDialog(methodElement) {
    state.currentMethod = methodElement;
    var q = $(methodElement);
    $("#method-dialog-name").val(q.children("tj-name").text());
    $("#method-dialog-type").val(q.children("tj-type").text());
    $("#method-dialog").dialog('open');
}

function saveClass() {
    var q = $(state.currentClass);
    q.children("tj-name").text($("#class-dialog-name").val());
    if (state.currentClass.parentNode == null) {
        document.getElementById("diagram").appendChild(state.currentClass);
    }
}

function saveProperty() {
    var q = $(state.currentProperty);
    q.children("tj-name").text($("#property-dialog-name").val());
    q.children("tj-type").text($("#property-dialog-type").val());
    if (state.currentProperty.parentNode == null) {
        $(state.currentClass).children("tj-properties").get(0).appendChild(state.currentProperty);
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
            } else if (name == "tj-class") {
                openClassDialog(element);
                return;
            } else {
                console.log(event.target.tagName);
            }
        }
        
        element = element.parentNode;
    }
    
    if (event.target == document.getElementById('diagram')) {
      addClass(event.clientX, event.clientY);
    }  
    // No element found.  
    
});