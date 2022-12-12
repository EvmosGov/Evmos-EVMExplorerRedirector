var defaultOptions = {
  options: {
    isExtEnabled: true,
    isNewTab: false,
    isNotify: false,
    rules: [
      {
        src: "^https?://evm.evmos.org/address/(.*)/?$",
        dst: "https://escan.live/address/$1",
        isEnabled: true,
        isRegex: true
      },
      {
        src: "^https?://evm.evmos.org/address/(.*)/transactions$",
        dst: "https://escan.live/address/$1#evm-txs",
        isEnabled: true,
        isRegex: true
      },
      {
        src: "^https?://evm.evmos.org/address/(.*)/tokens$",
        dst: "https://escan.live/address/$1",
        isEnabled: true,
        isRegex: true
      },
      {
        src: "^https?://evm.evmos.org/address/(.*)/token-transfers$",
        dst: "https://escan.live/address/$1#token20-txs",
        isEnabled: true,
        isRegex: true
      },
      {
        src: "^https?://evm.evmos.org/token/(.*)/?$",
        dst: "https://escan.live/token/$1",
        isEnabled: true,
        isRegex: true
      },
      {
        src: "^https?://evm.evmos.org/tx/(.*)/?$",
        dst: "https://escan.live/tx/$1",
        isEnabled: true,
        isRegex: true
      },
      {
        src: "^https?://evm.evmos.org/block/(.*)/?$",
        dst: "https://escan.live/block/$1",
        isEnabled: true,
        isRegex: true
      }
    ],
  },
};

var isExtEnabled;
var isNewTab = false;
var isNotify = false;
var rules;
var lastTabId = 0;

function matchUrl(url) {
  if (rules == undefined || url == undefined || isExtEnabled == false) {
    return false;
  }
  for (var i = 0; i < rules.length; i++) {
    var isEnabled = rules[i].isEnabled;
    var isRegex = rules[i].isRegex;
    var src = rules[i].src;
    var dst = rules[i].dst;

    if (isEnabled) {
      if (isRegex) {
        var re = new RegExp(src);
        if (url.search(re) != -1) {
          var newUrl = url.replace(re, dst);
          if (url != newUrl) {
            return newUrl;
          }
        }
      } else {
        if (url == src) {
          return dst;
        }
      }
    }
  }

  return false;
}

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

function notify() {
  if (!isNotify) {
    return;
  }
}

chrome.tabs.onUpdated.addListener(function (tabId, change, _tab) {
  if (change.status == 'loading') {
    var newUrl = matchUrl(change.url);
    if (newUrl) {
      console.log('[notice] matching with tabs event')
      console.log('[notice] matched: ' + change.url);
      console.log('[notice] redirecting to: ' + newUrl);
    }
  }
  if (change.status == 'complete' && tabId == lastTabId) {
    lastTabId = 0;
  }
});

chrome.webRequest.onBeforeRequest.addListener(
  function (request) {
    var newUrl = matchUrl(request.url);
    if (newUrl) {
      console.log('[notice] matching with webRequest event')
      console.log('[notice] matched :' + request.url);
      console.log('[notice] redirecting to: ' + newUrl);
      if (isNewTab == false) {
        chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
          chrome.tabs.update(tabs[0].id, {url: newUrl});
        });
      } else {
        chrome.tabs.create({url: newUrl});
      }
    }
  },
  {
    types: ['main_frame'],
    urls: ['<all_urls>'],
  },
  [],
);

chrome.runtime.onMessage.addListener(function (
  request,
  _sender,
  _sendResponse,
) {
  console.log('[msg:recv] ' + request.type);
  if (request.type == 'syncOptions') {
    isExtEnabled = request['options']['options']['isExtEnabled']
    isNewTab = request['options']['options']['isNewTab'];
    isNotify = request['options']['options']['isNotify'];
    rules = request['options']['options']['rules'];
  }
  if (request.type == 'resetRules') {
    var newOptions = {
      options: {
        isExtEnabled: true,
        isNewTab: false,
        isNotify: false,
        rules: defaultOptions['options']['rules'],
      },
    };
    rules = defaultOptions['options']['rules'];
    chrome.storage.sync.set(newOptions, function () {
      var msg = {
        type: 'reloadOptions',
      };
      chrome.runtime.sendMessage(msg, function (_response) {
        console.log('[msg:send] reloadOptions');
      });
    });
  }
});

getOptions(function () {
  console.log('[notice] getOption Done');
});

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == 'install') {
    console.log('[event:onInstalled] set default options');
    chrome.storage.sync.set(defaultOptions);
  } else if (details.reason == 'update') {
    // try loading from local
    chrome.storage.local.get('options', function (data) {
      // if present, then set to sync and clear
      if (data.options) {
        console.log('[event:onInstalled] found local options and migrating');
        chrome.storage.local.clear();
        chrome.storage.sync.set(data);
      }
    });
  }
});
