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

function openClassDialog(element) {
    state.currentClass = element;
    var q = $(element);
    $("#class-editor-name").val(q.children("tj-name").text());
    $("#class-dialog").dialog('open');
}

function openPropertyDialog(element) {
    state.currentProperty = element;
    var q = $(element);
    $("#property-editor-name").val(q.children("tj-name").text());
    $("#property-editor-type").val(q.children("tj-type").text());
    $("#property-dialog").dialog('open');
}

function saveClass() {
    var q = $(state.currentClass);
    q.children("tj-name").text($("#class-editor-name").val());
    if (state.currentClass.parentNode == null) {
        document.getElementById("diagram").appendChild(state.currentClass);
    }
}

function saveProperty() {
    var q = $(state.currentProperty);
    q.children("tj-name").text($("#property-editor-name").val());
    q.children("tj-type").text($("#property-editor-type").val());
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