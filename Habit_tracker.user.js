// ==UserScript==
// @name        Habit tracker
// @namespace   h
// @description Records interaction with habitrpg locally. Allows json export
// @include     https://habitrpg.com/*
// @version     1
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// ==/UserScript==

(function () {
	if (window.top != window.self) {
		return;
	}
	
	// http://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
	function offerDownload (filename, text) {
		var pom = document.createElement('a');
		pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		pom.setAttribute('download', filename);

		var event = document.createEvent('MouseEvents');
		event.initEvent('click', true, true);
		pom.dispatchEvent(event);
	}
	
	function addExportButton () {
		var btn = document.createElement("input");
		btn.setAttribute("type", "button");
		btn.setAttribute("value", "Export");
		btn.addEventListener("click", function (e) {
			var keys = GM_listValues();
			keys.sort();
			arr = [];
			for each (var key in keys) {
				arr.push(JSON.parse(GM_getValue(key)));
			}
			offerDownload("habits.json", JSON.stringify(arr));
		});
		document.querySelector("div.toolbar-container").appendChild(btn);
	}
	
	window.addEventListener ("load", addExportButton, false);

	function getUsername () {
		return document.querySelector("div.avatar-name.ng-binding").textContent.trim();
	}

	function log_happening (obj) {
		GM_setValue(obj.time, JSON.stringify(obj));
	}

	function itemCompleted (node, good) {
		var par = node.parentNode;
		var taskText = par.getElementsByTagName("markdown")[0].textContent.trim();
		var divNode = par.parentNode.parentNode.parentNode;
		var liNode = divNode.parentNode;
		var itemText = divNode.getElementsByTagName("markdown")[0].textContent.trim();
		
		var tt = liNode.classList.contains("daily") ? "daily" : "todo";
		var name = getUsername ();
		
		var obj = {type: tt + "-item", checked: good, itemText: itemText, taskText: taskText, time: Date.now(), name:name};
		
		log_happening(obj);
	}
	function taskCompleted (node, good) {
		var liNode = node.parentNode.parentNode.parentNode;
		var divNode = liNode.getElementsByTagName("div")[2];
		var text = divNode.getElementsByTagName("markdown")[0].textContent.trim();
		
		var tt = liNode.classList.contains("daily") ? "daily" : "todo";
		var name = getUsername ();
			
		var obj = {type: tt + "-task", checked: good, taskText: text, time: Date.now(), name:name};
		
		log_happening(obj);
	}
	function habitChg (node, good) {
		var liNode = node.parentNode.parentNode.parentNode;
		var divNode = liNode.getElementsByTagName("div")[3];
		var text = divNode.getElementsByTagName("markdown")[0].textContent.trim();
		var name = getUsername ();
		var obj = {type: "habit", positive: good, habitText: text, time: Date.now(), name:name};
		
		log_happening(obj);
	}

	// Hook the global click event, because angular could change the dom.
	document.body.addEventListener("click", function (e) {
		var node = e.target;
		if (node.tagName == "INPUT" && node.getAttribute("ng-model") == "item.completed") {
			itemCompleted (node, node.checked);
		}
		if (node.tagName == "INPUT" && node.getAttribute("ng-model") == "task.completed") {
			taskCompleted (node, node.checked);
		}
		
		if (node.tagName == "SPAN")	{
			node = node.parentNode;
		}
		if (node.tagName == "A") {
			ngif = node.getAttribute("ng-if");
			if (ngif == "task.up")
				habitChg (node, true);
			else if (ngif == "task.down") {
				habitChg (node, false);
			}
		}
	}, true);
}) ();