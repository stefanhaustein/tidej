function getStorageId() {
	var id = window.location.hash;
	if (id != null) { 
		if (id.length > 0 && id.charAt(0) == '#') {
			id = id.substring(1);
		}
		if (id == '') {
			return null;
		}
	}
	return id;
}


function save() {
	var content = $("#diagram").html();
	
	console.log("content:", content);

	xmlhttp = new XMLHttpRequest();
	var path = "storage";
	var id = getStorageId();
	if (id != null) {
		path += "?id=" + id;
	}
	xmlhttp.open("POST", path, true);
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			var o = eval('(' + xmlhttp.responseText + ')');
			var retId = o['id'];
			var rev = o['rev'];
			window.console.log("id", id, "retId", retId, "rev", rev);
			history.pushState(null, null, "#" + retId);
	  	}
	 }
	xmlhttp.send(content);
}


function load(callback) {
	var id = getStorageId();
	if (id == null) {
		return;
	}
	var path = "storage?id=" + id;
	xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", path, true);
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4) {
			var content = xmlhttp.responseText;
			console.log(content);
			$("#diagram").html(content);
			if (callback) {
				callback();
			}
	  	}
	 }
	xmlhttp.send();
}