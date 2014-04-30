
function openPropertyDialog(element) {
    var artifact = $(element);
    document.getElementById("property-editor-name").setAttribute("value", artifact.children("tj-name").text());
    document.getElementById("property-editor-type").setAttribute("value", artifact.children("tj-type").text());
    $("#property-dialog").dialog('open');
}

function openClassDialog(element) {
    var artifact = $(element);
    document.getElementById("class-editor-name").setAttribute("value", artifact.children("tj-name").text());
    window.currentClass = element;
    $("#class-dialog").dialog('open');
}


function addClass(x, y) {
    var newClass = document.getElementById("class-template").cloneNode(true);
    newClass.removeAttribute("id");
    $(newClass).draggable(); // 
    newClass.style.position = "absolute";
    newClass.style.top = y + "px";
    newClass.style.left = x + "px";
    
    document.getElementById("diagram").appendChild(newClass);
}

$("tj-class").draggable();

$("#property-dialog").dialog({
    autoOpen: false,
    buttons: {
        'Cancel': function() {
            $("#property-dialog").dialog('close');
        },
        'Ok': function() {
            $("#property-dialog").dialog('close');
        }
    }
});

$("#class-dialog").dialog({
    autoOpen: false,
    modal: true,
    buttons: {
        'Add Property': function(event) {
            $(this).dialog("close");
        },
        'Add Method': function(event) {
            $(this).dialog("close");
        },
        'Delete': function(event) {
            window.currentClass.parentNode.removeChild(window.currentClass);
            $(this).dialog("close");
        },
        'Cancel': function() {
            $(this).dialog("close");
        },
        'Save': function() {
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