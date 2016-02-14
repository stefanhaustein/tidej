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

modal.dialog = document.createElement("div");
modal.dialog.style.backgroundColor = "white";
modal.dialog.style.width = "80%";
modal.dialog.style.maxWidth = "600px";
modal.dialog.style.padding = "30px";
modal.dialog.style.boxSizing = "border-box";
modal.dialog.style.margin = "50px auto";
modal.dialog.style.display = "none";

modal.background.appendChild(modal.dialog);

modal.menu = document.createElement("div");
modal.menu.style.backgroundColor = "white";
modal.menu.style.display = "none";

modal.background.appendChild(modal.menu);

modal.showDeferredTimeout = null;

modal.getPosition = function(element) {
  var x = 0;
  var y = 0;
  while(element && !isNaN(element.offsetLeft) && !isNaN(element.offsetTop)) {
        x += element.offsetLeft - element.scrollLeft;
        y += element.offsetTop - element.scrollTop;
        element = element.offsetParent;
    }
    return {x: x, y: y};
};

modal.showDeferred = function(label) {
  modal.showDeferredTimeout = window.setTimeout(function() {modal.show(label);}, 500);
}

modal.show = function(label) {
  modal.background.style.backgroundColor = "rgba(0,0,0,0.5)";
  modal.background.onclick = null;
  modal.dialog.style.display = "block";
  modal.showDeferredTimeout = null;
  modal.dialog.innerHTML = label;
  document.body.appendChild(modal.background);
}

modal.hide = function() {
  if (modal.showDeferredTimeout) {
    window.clearTimeout(modal.showDeferredTimeout);
    modal.showDeferredTimeout = null;
  } else {
    document.body.removeChild(modal.background);
    modal.dialog.style.display = "none";
    modal.menu.style.display = "none";
  }
}

modal.prompt = function(label, value, callback) {
  modal.show('<p>' + label +'</p><p><input style="width:100%"></input></p><p style="text-align:right"><button>Cancel</button><button>Ok</button></p>');
  modal.dialog.querySelector("p").innerHTML = label;
  var input = modal.dialog.querySelector("input");
  input.value = value;
  var buttons = modal.dialog.querySelectorAll("button");
  buttons[0].onclick = buttons[1].onclick = function() {
     modal.hide();
     if (callback && this.textContent == "Ok") {
       callback(input.value);
     }
  };
}

modal.showMenu = function(anchor, cssClass, options, callback) {
  var pos = modal.getPosition(anchor);
  modal.background.style.backgroundColor = "rgba(0,0,0,0)";
  modal.menu.style.display = "block";
  window.console.log("anchor:", anchor, "cw: " + anchor.clientWidth, "ch: " + anchor.clientHeight);
  modal.menu.style.top = (pos.y + anchor.clientHeight) + "px";
  modal.menu.style.right = pos.x + "px";
  modal.menu.style.position = "fixed";
  modal.menu.className = cssClass;

  modal.menu.innerHTML = "";
  for (var i = 0; i < options.length; i++) {
    var entry = document.createElement("div");
    entry.textContent = options[i];
    modal.menu.appendChild(entry);
  }
  document.body.appendChild(modal.background);

  modal.background.onclick = function(event) {
    modal.menu.style.display = "none";
    document.body.removeChild(modal.background);
    if (event.target.parentNode == modal.menu) {
      callback(event.target.textContent);
    }
  };

}