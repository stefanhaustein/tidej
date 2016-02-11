
function parseParams(s) {
    var parts = s.split(';');
	var result = {};
	for (var i = 0; i < parts.length; i++) {
		var part = parts[i];
		var cut = part.indexOf('=');
		if (cut != -1) {
			result[part.substr(0, cut)] = part.substr(cut + 1);
		}
	}
	return result;
}

function loadContent(id, callback) {
  var path = "/storage?id=" + id + "&cache-poison=" + Math.random();
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", path, true);
  xmlhttp.onreadystatechange = function() {
	if (xmlhttp.readyState == 4) {
	  var rawContent = xmlhttp.responseText;
	  var cut = rawContent.indexOf('\n');
	  var meta = parseParams(rawContent.substr(0, cut));
	  var content = rawContent.substr(cut + 1);
	  console.log("raw:", rawContent, "content", content, "meta:", meta);
	  if (callback) {
	 	callback(content, meta);
	  }
    }
  };
  xmlhttp.send();
}


// Callback is called with the (potentially new) id and revision.
function saveContent(content, id, secret, callback) {
  var xmlhttp = new XMLHttpRequest();
  var path = "/storage?tag=dev";
  if (id != null) {
    path += "&id=" + id;
    if (secret != null) {
      path += "&secret=" + secret;
    }
  }
  var self = this;
  xmlhttp.open("POST", path, true);
  xmlhttp.onreadystatechange = function() {
	if (xmlhttp.readyState == 4) {
      var meta = parseParams(xmlhttp.responseText);
	  var newId = meta['id'];
	  var revision = meta['rev'];
	  var secret = meta['secret'];
	  window.console.log("id", id, "ret-meta:", meta);
      if (callback != null) {
		    callback(newId, secret);
	    }
	  }
  }
  xmlhttp.send(content);
}

