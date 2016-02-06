var lastSaved;

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

function load(id, rev, callback) {
  var params = tidej.runtime.params();
  var id = params['id'];
  if (id == null) {
	return;
  }
  var path = "/storage?id=" + id;
  if (rev != null) {
	path += "&rev=" + rev;
  } else {
	path += "&cache-poison=" + Math.random();
  }
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
function save(content, id, secret, callback) {
  if (content == lastSaved) {
	console.log("content empty or unchanged!");
	if (callback != null) {
		callback();
	}
	return;
  }
  this.lastSaved = content;

  xmlhttp = new XMLHttpRequest();
  var path = "/storage";
  if (id != null && secret != null) {
    path += "?id=" + id + "&secret=" + secret;
  }
  var self = this;
  xmlhttp.open("POST", path, true);
  xmlhttp.onreadystatechange = function() {
	if (xmlhttp.readyState == 4) {
      var meta = tidej.runtime.parseParams(xmlhttp.responseText);
	  var newId = meta['id'];
	  var revision = meta['rev'];
	  window.console.log("id", id, "ret-meta:", meta);
      if (callback != null) {
		callback(newId, revision);
	  }
	}
  }
  xmlhttp.send(content);
}

