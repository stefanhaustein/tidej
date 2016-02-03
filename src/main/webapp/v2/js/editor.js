
tidej.Editor = function() {
	this.codeMirror = null;
    this.currentClass = null;
    this.currentProperty = null;
    this.currentMethod = null;
    this.revision = -1;
    this.saveTimer = -1;
    this.initUi();
    this.lastSaved = null;
    this.id = -1;
    this.revision = null;
}


tidej.Editor.prototype.addClass = function () {
    var newClass = $("#templates tj-class").get(0).cloneNode(true);
    $(newClass).draggable(); // 
    newClass.style.position = "absolute";
    var diagramQuery = $("#diagram");
    var diagram = diagramQuery.get(0);
    newClass.style.top = (Math.random() * (diagram.offsetWidth - 200)) + "px";
    newClass.style.left = (Math.random() * (diagram.offsetHeight - 100)) + "px";
    
    $(newClass).children("tj-name").text("Klasse" + (diagramQuery.children().size() + 1));
    
    diagram.appendChild(newClass);
}


tidej.Editor.prototype.addProperty = function() {
	if (this.saveClass()) {
		$('#class-dialog').dialog('close');
		var newProperty = $("#templates tj-property").get(0).cloneNode(true);
		this.openPropertyDialog(newProperty);
	}
}


tidej.Editor.prototype.addMethod = function() {
	if (this.saveClass()) {
		$('#class-dialog').dialog('close');
		var newMethod = $("#templates tj-method").get(0).cloneNode(true);
		this.openMethodDialog(newMethod);
	}
}


tidej.Editor.prototype.addParam = function(after, name, type) {
	var row = '<tr class="horizontal method-dialog-param">' +
		'<th>Parameter:' +
		'<td><input value="' + (name||'') + '" required pattern="[a-z][A-Za-z0-9]*" ' + 	
			'validationMessage="Parameternamen müssen mit einem Kleinbuchstaben anfangen und dürfen nur aus Buchstaben und Ziffern bestehen"></input></td>' +
		'<td><input value="' + (type||'') + '"></input></td>' +
		'<td><button onclick="tidej.editor.addParam(this)">+</button>' + 
		'<button onclick="tidej.editor.removeParam(this)">\u2212</button></td>' +
		'</tr>';
	$(after).closest('tr').after(row);
}


tidej.Editor.prototype.checkSyntax = function(text) {
	try {
		esprima.parse("function xyz() {\n" + text + "\n}");
		return [];
	} catch (error) {
		console.log(error);
		return[{
			from: CodeMirror.Pos(error.lineNumber - 2, error.column - 1),
            to: CodeMirror.Pos(error.lineNumber - 2, error.column - 1),
            message: error.description
		}];
	}
};

tidej.Editor.prototype.initDiagram = function(content, meta) {
	$("#diagram").html(content);
	this.lastSaved = content;
	this.revision = meta['rev'];
	$("#revision").text(this.revision);
	$("tj-class").draggable();
};


tidej.Editor.prototype.initUi = function() {
	var self = this;
	this.codeMirror = CodeMirror.fromTextArea($('#method-dialog-body').get(0), {
	    lineNumbers: true,
	    mode: "javascript",
	    gutters: ["CodeMirror-lint-markers"],
	    lint: function(text) {
	    	console.log("lint", self);
	    	return self.checkSyntax(text);
	    }
	});
	$('#control button').button();

	$('body').layout({
	  	west: {
	   		resizable: false,
	   		size: 130,
	   		spacing_open: 0,
	   		spacing_closed: 0,
	   		closable: false,
	   	},
	   	east: {
	   		maskIframesOnResize: true,
	   		size: 350,
	   		spacing_open: 16,
	   		spacing_closed: 16,
	   		closable: false,
	   	}
	});

	$('#diagram').bind('DOMSubtreeModified', function() {
		var title = $('#diagram tj-class.application>tj-name').text();
		if (title != null && title != '') {
			window.document.title = "Tidej - " + title;
		}
		
		if (self.saveTimer != -1) {
			window.clearTimeout(tidej.editor.saveTimer);
		}
		self.saveTimer = window.setTimeout(function() {
			self.save();
		}, 4000);
	});
	
	$('#class-dialog').dialog({
		autoOpen: false,
		modal: true,
		width: 450,
		buttons: {
			'Abbrechen': function() {
				$(this).dialog("close");
			},
			'Löschen': function(event) {
				var parent = self.currentClass.parentNode;
				if (parent != null) {
					parent.removeChild(self.currentClass);
				}
				$(this).dialog("close");
			},
			'Speichern': function() {
				if (self.saveClass()) {
					$(this).dialog("close");
				}
			}
		}
	});

	$('#property-dialog').dialog({
		autoOpen: false,
		modal: true,
		width: 450,
		buttons: {
			'Abbrechen': function() {
				$("#property-dialog").dialog('close');
			},
			'Löschen': function(event) {
				var parent = self.currentProperty.parentNode;
				if (parent != null) {
					parent.removeChild(self.currentProperty);
				}
				$(this).dialog("close");
			},
			'Speichern': function() {
				if (self.saveProperty()) {
					$("#property-dialog").dialog('close');
				}
			}
		}
	});

	$('#method-dialog').dialog({
		autoOpen: false,
		modal: true,
		width: 800,
		height: 600,
		open: function() {
			self.codeMirror.refresh();
		},
		buttons: {
			'Abbrechen': function() {
				$("#method-dialog").dialog('close');
			},
			'Löschen': function(event) {
				var parent = self.currentMethod.parentNode;
				if (parent != null) {
					parent.removeChild(self.currentMethod);
				}
				$(this).dialog("close");
			},
			'Speichern': function() {
				if (self.saveMethod()) {
					$("#method-dialog").dialog('close');
				}
			}
		}
	});

	$('body').click(function (event) {
		var element = event.target;
		while (element != null) {
			var name = element.tagName;
			if (name != null) {
				if (element.id == 'class-dialog') {
					return;
				}
				name = name.toLowerCase();

				if (name == 'tj-property') {
					self.openPropertyDialog(element);
					return;
				} 
				if (name == 'tj-method') {
					self.openMethodDialog(element);
					return;
				} 
				if (name == 'tj-class') {
					self.openClassDialog(element);
					return;
				} 
			}
			element = element.parentNode;
		}
	});
};



tidej.Editor.prototype.load = function() {
	window.console.log('load triggered...');
	this.stop();
	if (tidej.runtime.params()['id'] != null) {
		$("#diagram").text("Loading...")
		tidej.runtime.load(function(meta, content) {
			tidej.editor.initDiagram(meta, content);
		});
	}
}


tidej.Editor.prototype.openClassDialog = function(classElement) {
    this.currentClass = classElement;
    var q = $(classElement);
    $("#class-dialog-name").val(q.children("tj-name").text());
    $("#class-dialog-doc").val(q.children("tj-doc").text());
    $("#class-dialog-application").prop('checked', q.hasClass("application"));
    $("#class-dialog").dialog('open');
}


tidej.Editor.prototype.openPropertyDialog = function(propertyElement) {
    this.currentProperty = propertyElement;
    var q = $(propertyElement);
    $("#property-dialog-name").val(q.children("tj-name").text());
    $("#property-dialog-type").val(q.children("tj-type").text());
    $("#property-dialog-value").val(q.children("tj-value").text());
    $("#property-dialog-doc").val(q.children("tj-doc").text());
    var modifier = q.hasClass("const") ? "const" : q.hasClass("static") ? "static" : "";
    $("#property-dialog-modifier").val(modifier); 
    $("#property-dialog").dialog('open');
}


tidej.Editor.prototype.openMethodDialog = function(methodElement) {
    this.currentMethod = methodElement;
    var q = $(methodElement);
    $("#method-dialog-name").val(q.children("tj-name").text());
    var type = q.children("tj-type").text();
    $("#method-dialog-type").val(type);
    $("#method-dialog-doc").val(q.children("tj-doc").text());
    		
    this.codeMirror.setValue(q.children("tj-body").text());
    
    var modifier;
    if (q.hasClass("constructor")) {
    	modifier = "constructor";
    } else {
    	modifier = 
    		(q.hasClass('static') ? 'static ' : 'member ') + 
    		(type != null && type != '' ? 'function' : 'procedure');
    }
    $("#method-dialog-modifier").val(modifier); 

    $(".method-dialog-param").remove();
    var insertAfter = $('#method-dialog-name').get(0);
    q.find("tj-param").each(function() {
        tidej.editor.addParam(insertAfter,
        		$(this).children("tj-name").text(),
        		$(this).children("tj-type").text());
    	insertAfter = $(".method-dialog-param").last().get(0);
    });
    $("#method-dialog").dialog('open');
}


tidej.Editor.prototype.removeParam = function(button) {
	$(button).closest('tr').remove();
}

tidej.Editor.prototype.run = function(fullscreen) {
	var self = this;
	if (fullscreen) {
		this.save(function() {
			var url = 'run.html#id=' + tidej.runtime.params()['id'] + ';rev=' + self.revision;
			window.console.log(url);
			var win = window.open(url, '_blank');
			win.focus();
		});
	} else {
		this.save(function() {
			self.stop(function() {
				$('#stop-button').button('enable');
				var iframe = document.getElementById('run');
				iframe.onload = function() {
					iframe.contentWindow.tidej.runtime.run($('#diagram').html(), self);
				}
				iframe.setAttribute('src', 'run.html');
			});
		});
	}
}


tidej.Editor.prototype.saveClass = function() {
	if (!this.validateClass()) {
		return false;
	}
    var q = $(this.currentClass);
    q.children("tj-name").text($("#class-dialog-name").val());
    q.children("tj-doc").text($("#class-dialog-doc").val());
    if (this.currentClass.parentNode == null) {
        document.getElementById("diagram").appendChild(this.currentClass);
    }
    
    if ($("#class-dialog-application").is(':checked')) {
    	$("tj-class").removeClass("application");
        q.addClass("application");
    } else {
        q.removeClass("application");
    }
    return true;
}

tidej.Editor.prototype.saveProperty = function() {
	if (!this.validateProperty()) {
		return false;
	}
    var $p = $(this.currentProperty);
    $p.children("tj-name").text($("#property-dialog-name").val());
    $p.children("tj-type").text($("#property-dialog-type").val());
    $p.children("tj-value").text($("#property-dialog-value").val());
    $p.children("tj-doc").text($("#property-dialog-doc").val());

    var modifier = $("#property-dialog-modifier").val();
    $p.toggleClass("const", modifier == 'const');
    $p.toggleClass('static', modifier == 'static');
    
    if (this.currentProperty.parentNode == null) {
        $(this.currentClass).children("tj-properties").get(0).appendChild(this.currentProperty);
    }
    return true;
}

tidej.Editor.prototype.saveMethod = function() {
	if (!this.validateMethod()) {
		return false;
	}
    var $m = $(this.currentMethod);
    $m.children('tj-name').text($('#method-dialog-name').val());
    $m.children('tj-type').text($('#method-dialog-type').val());
    $m.children('tj-body').text(this.codeMirror.getValue());
    $m.children('tj-doc').text($('#method-dialog-doc').val());
    
    var modifier = $("#method-dialog-modifier").val();
    $m.toggleClass("static", modifier.startsWith('static '));
    $m.toggleClass("constructor", modifier == "constructor");
    
    var $params = $m.find("tj-params");
    $params.empty();
    $(".method-dialog-param").each(function() {
    	var inputs = $(this).find("input").get();
    	$params.append("<tj-param>" + 
    			"<tj-name>" + inputs[0].value + "</tj-name>" + 
    			"<tj-type>" + inputs[1].value + "</tj-type></tj-param>");
    });
    
    if (this.currentMethod.parentNode == null) {
        $(this.currentClass).children("tj-methods").get(0).appendChild(this.currentMethod);
    }
    return true;
}


tidej.Editor.prototype.save = function(callback) {
	var content = $("#diagram").html();
	console.log("save() called");
	if (content == this.lastSaved || $("#diagram tj-class").size() == 0) {
		console.log("content empty or unchanged!");
		if (callback != null) {
			callback();
		}
		return;
	}
	this.lastSaved = content;

	xmlhttp = new XMLHttpRequest();
	var path = "/storage";
	var params = tidej.runtime.params();
	var id = params['id'];
	var secret = params['secret'];
	if (id != null && secret != null) {
		path += "?id=" + id + "&secret=" + secret;
	}
	var self = this;
	xmlhttp.open("POST", path, true);
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			var meta = tidej.runtime.parseParams(xmlhttp.responseText);
			var newId = meta['id'];
			self.revision = meta['rev'];
			window.console.log("id", id, "ret-meta:", meta);
			$("#revision").text(self.revision);
			if (id != newId) {
				history.pushState(null, null, "#id=" + newId + ";secret=" + meta['secret']);
			}
			if (callback != null) {
				callback();
			}
	  	}
	 }
	xmlhttp.send(content);
}

tidej.Editor.prototype.stop = function(callback) {
	$('#stop-button').button('disable');
	var iframe = document.getElementById("run");
	if (iframe.getAttribute('src') == stop.html) {
		if (callback != null) {
			callback();
		}
	}
	iframe.onload = callback;
	iframe.setAttribute("src", "stop.html");
}

tidej.Editor.prototype.showError = function(className, memberName, line, message) {
	var diagramElement = document.getElementById('diagram');
	var classElement = tidej.dom.findName(diagramElement, className);
	
	var propertiesElement = tidej.dom.getChildElement(classElement, 'tj-properties');
	var propertyElement = tidej.dom.findName(propertiesElement, memberName);
	
	if (propertyElement != null) {
		this.openPropertyDialog(propertyElement);
	} else {
		var methodsElement = tidej.dom.getChildElement(classElement, 'tj-methods');
		var methodElement = tidej.dom.findName(methodsElement, memberName);
		var self = this;
		if (methodElement != null) {
			this.openMethodDialog(methodElement);
			self.codeMirror.setSelection({line: line, ch: 0}, {line: line, ch:99});
		}
	}
	window.alert(message);
}

tidej.Editor.prototype.applyValidationMessages = function(form) {
	$(form).find('input[validationMessage]').each(function() {
		this.setCustomValidity('')
		if (!this.checkValidity()) {
			this.setCustomValidity(this.getAttribute('validationMessage'));
		}
	});
}

tidej.Editor.prototype.validateClass = function() {
	var form = document.getElementById('class-dialog');
	this.applyValidationMessages(form);
	document.getElementById('class-dialog-fake-submit').click();
	return form.checkValidity();
}

tidej.Editor.prototype.validateMethod = function() {
	var modifier = $('#method-dialog-modifier').val();
	var nameInput = document.getElementById('method-dialog-name');
	nameInput.setCustomValidity('');
	
	var ctor = modifier == 'constructor';
	nameInput.setAttribute('pattern', (ctor ? '[A-Z]' : '[a-z]') + '[A-Za-z0-9]*');
	if (!ctor) {
		nameInput.setAttribute('validationMessage', 
				'Der Methodenname muss mit einem Kleinbuchstaben anfangen und darf nur Buchstaben und Ziffern enthalten');
	}
	
	var form = document.getElementById('method-dialog');
	this.applyValidationMessages(form);

	var name = nameInput.value;
	var className = $(this.currentMethod.parentNode.parentNode).children('tj-name').text();
	
	if (ctor) {
		if (name != className) {
			nameInput.setCustomValidity('Der Konstruktorname muss mit dem Klassennamen übereinstimmen');
		} 
	} else {
		if (name == className) {
			nameInput.setCustomValidity('Der Methodenname darf nicht mit dem Klassennamen übereinstimmen');
		}
	}
	
	document.getElementById('method-dialog-fake-submit').click();
	
	var errors = this.checkSyntax(this.codeMirror.getValue());
	if (errors.length > 0) {
		var first = errors[0];
		window.alert('Error in line ' + first.from.line + ': ' + first.message);
		return false;
	}

	return form.checkValidity();
}

tidej.Editor.prototype.validateProperty = function() {
	var modifier = $('#property-dialog-modifier').val();
	var nameInput = document.getElementById('property-dialog-name');
	var valueInput = document.getElementById('property-dialog-value');
	var namePattern;
	var nameMessage;
	if (modifier == 'const') {
		namePattern = '[A-Z][A-Z0-9_]*';
		nameMessage = 'Namen von Konstanten müssen mit einem Grossbuchstaben anfangen und dürfen nur Grossbuchstaben, Ziffern und Unterstriche enthalten.';
		valueInput.setAttribute('required', 'required');
	} else {
		namePattern = '[a-z][A-Za-z0-9]*';
		nameMessage = 'Namen von Eigenschaften müssen mit einem Kleinbuchstaben anfangen und dürfen nur Buchstaben und Ziffern enhalten.';
		valueInput.removeAttribute('required');
	}
	nameInput.setAttribute('pattern', namePattern);
	nameInput.setAttribute('validationMessage', nameMessage);

	value = valueInput.value;
	if (value != null && value != '') {
		try {
			esprima.parse('xyz = ' + value + ';');
			valueInput.setCustomValidity('');
		} catch(e) {
			valueInput.setCustomValidity(e.message);
		}
	}
	
	var form = document.getElementById('property-dialog');
	this.applyValidationMessages(form);
	document.getElementById('property-dialog-fake-submit').click();
	return form.checkValidity();
}



tidej.editor = new tidej.Editor();

