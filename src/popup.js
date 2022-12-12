

function getOptions(callback) {
	chrome.storage.sync.get('options', function (data) {
	  if (data.options) {
		isExtEnabled = data.options.isExtEnabled;
		isNewTab = data.options.isNewTab;
		isNotify = data.options.isNotify;
		rules = data.options.rules;
	  }
	  callback();
	});
  }

getOptions(function () {
	console.log('[notice] getOption Done');
});

function setOptions(toggleSettings) {
	var newOptions = {
	  options: {
		isExtEnabled: toggleSettings,
		isNewTab: false,
		isNotify: false,
		rules: rules,
	  },
	};
	chrome.storage.sync.set(newOptions, function () {
	  var msg = {
		type: 'syncOptions',
		options: newOptions,
	  };
	  chrome.runtime.sendMessage(msg, function (_response) {
		console.log('[msg:send] syncOptions');
	  });
	});
  }
  
  
var openButton = document.querySelector("#open-settings");


function openRedirectorSettings() {
	chrome.tabs.create({url: "settings.html"});
};

openButton.addEventListener("click", openRedirectorSettings);
