var modal = {};

modal.background = document.createElement("div");
modal.background.style.zIndex = 1000;
modal.background.style.position = "fixed";
modal.background.style.left = 0;
modal.background.style.top = 0;
modal.background.style.bottom = 0;
modal.background.style.left = 0;
modal.background.style.width = "100%";
modal.background.style.height = "100%";
modal.background.style.backgroundColor = "rgba(0,0,0,0.5)";

modal.dialog = document.createElement("div");
modal.dialog.style.backgroundColor = "white";
modal.dialog.style.width = "80%";
modal.dialog.style.maxWidth = "600px";
modal.dialog.style.padding = "30px";
modal.dialog.style.boxSizing = "border-box";
modal.dialog.style.margin = "50px auto";

modal.background.appendChild(modal.dialog);

modal.menu = document.createElement("div");
modal.menu.style.backgroundColor = "white";
modal.menu.style.display = "none";

modal.background.appendChild(modal.menu);

modal.showDeferredTimeout = null;


modal.htmlEscape = function(html) {
  var escaped = '';
  for (var i = 0; i < html.length; i++) {
    var c = html[i];
    switch (c) {
    case '<': escaped += '&lt;'; break;
    case '>': escaped += '&gt;'; break;
    case '&': escaped += '&amp;'; break;
    case '"': escaped += '&quot;'; break;
    default: escaped += c;
    }
  }
  return escaped;
}

modal.alert = function(html, callback) {
  modal.show('<p>' + html +'</p><p style="text-align:right"><button>Ok</button></p>');
  var button = modal.dialog.querySelector("button");
  button.onclick = function() {
     modal.hide();
     if (callback) {
       callback();
     }
  };
}

modal.confirm = function(label, callback) {
  modal.show('<p>' + label +'</p><p style="text-align:right"><button>Cancel</button><button>Ok</button></p>');
  modal.dialog.querySelector("p").innerHTML = label;
  var buttons = modal.dialog.querySelectorAll("button");
  buttons[0].onclick = buttons[1].onclick = function() {
     modal.hide();
     if (callback) {
       callback(this.textContent == "Ok");
     }
  };
};

modal.getDocumentPosition = function(element) {
  var r = element.getBoundingClientRect();
  return {
    x: r.left + window.scrollX,
    y: r.top + window.scrollY
  }
};

modal.getViewportPosition = function(element) {
  var x = 0;
  var y = 0;
  while(element && !isNaN(element.offsetLeft) && !isNaN(element.offsetTop)) {
        x += element.offsetLeft - element.scrollLeft;
        y += element.offsetTop - element.scrollTop;
        element = element.offsetParent;
    }
    return {x: x, y: y};
};


modal.hide = function() {
  if (modal.showDeferredTimeout) {
    window.clearTimeout(modal.showDeferredTimeout);
    modal.showDeferredTimeout = null;
  } else {
    document.body.removeChild(modal.background);
  }
}

modal.prompt = function(html, value, callback) {
  modal.show('<p>' + html + '</p><p><input style="width:100%"></input></p>' +
      '<p style="text-align:right"><button>Cancel</button><button>Ok</button></p>');
  var input = modal.dialog.querySelector("input");
  input.value = value;
  input.setSelectionRange(0, value.length)

  var buttons = modal.dialog.querySelectorAll("button");
  buttons[0].onclick = buttons[1].onclick = function() {
     modal.hide();
     if (callback && this.textContent == "Ok") {
       callback(input.value);
     }
  };
}

modal.choice = function(html, options, callback) {
  var optionsHtml = "";
  for (var i = 0; i < options.length; i += 2) {
    if (options[i] == null) {
      optionsHtml += '<option selected value="">(select)</option>'
    } else {
      optionsHtml += '"<option value="' + modal.htmlEscape(options[i+1]) + '">' +
        modal.htmlEscape(options[i]) + '</option>';
    }
  }

  modal.show('<p>' + html + '</p><p><select style="width:100%">' + optionsHtml + '</select>' +
       '<p style="text-align:right"><button>Cancel</button><button>Ok</button></p>');

  var select = modal.dialog.querySelector("select");
  var buttons = modal.dialog.querySelectorAll("button");
  buttons[0].onclick = buttons[1].onclick = function() {
     modal.hide();
     if (callback && this.textContent == "Ok" && select.value) {
       callback(select.value);
     }
  };
}

modal.show = function(html) {
  modal.dialog.style.display = "block";
  modal.showDeferredTimeout = null;
  modal.dialog.innerHTML = html;
  document.body.appendChild(modal.background);
}

modal.showDeferred = function(label) {
  modal.showDeferredTimeout = window.setTimeout(function() {modal.show(label);}, 500);
}
