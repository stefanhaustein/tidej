var modal = {};

modal.background = document.createElement("div");
modal.background.style.zIndex = 1000;
modal.background.style.position = "fixed";
modal.background.style.backgroundColor = "rgba(0,0,0,0.5)";
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

modal.background.appendChild(modal.dialog);

modal.showDeferredTimeout = null;

modal.showDeferred = function(label) {
  modal.showDeferredTimeout = window.setTimeout(function() {modal.show(label);}, 500);
}

modal.show = function(label) {
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