const validator = new ContentFarmFilter();

function quit() {
  if (history.length > 1) {
    history.go(-1);
  } else {
    chrome.tabs.getCurrent((tab) => {
      chrome.runtime.sendMessage({
        cmd: 'closeTab',
        args: {tabId: tab.id}
      });
    });
  }
}

function loadOptions() {
  return utils.getDefaultOptions().then((options) => {
    document.querySelector('#userBlacklist textarea').value = options.userBlacklist;
    document.querySelector('#userWhitelist textarea').value = options.userWhitelist;
    document.querySelector('#webBlacklists textarea').value = options.webBlacklists;
    document.querySelector('#transformRules textarea').value = options.transformRules;
    document.querySelector('#showContextMenuCommands input').checked = options.showContextMenuCommands;
    document.querySelector('#showUnblockButton input').checked = options.showUnblockButton;

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        cmd: 'getMergedBlacklist',
      }, resolve);
    }).then((blacklist) => {
      document.querySelector('#allBlacklist textarea').value = blacklist;
    });
  });
}

function saveOptions() {
  const userBlacklist = document.querySelector('#userBlacklist textarea').value;
  const userWhitelist = document.querySelector('#userWhitelist textarea').value;
  const webBlacklists = document.querySelector('#webBlacklists textarea').value;
  const transformRules = document.querySelector('#transformRules textarea').value;
  const showContextMenuCommands = document.querySelector('#showContextMenuCommands input').checked;
  const showUnblockButton = document.querySelector('#showUnblockButton input').checked;

  return utils.setOptions({
    userBlacklist: validator.validateRulesText(userBlacklist),
    userWhitelist: validator.validateRulesText(userWhitelist),
    webBlacklists: webBlacklists,
    transformRules: validator.validateTransformRulesText(transformRules),
    showContextMenuCommands: showContextMenuCommands,
    showUnblockButton: showUnblockButton,
  });
}

document.addEventListener('DOMContentLoaded', (event) => {
  utils.loadLanguages(document);

  // hide some options if contextMenus is not available
  // (e.g. Firefox for Android)
  if (!chrome.contextMenus) {
    document.querySelector('#transformRules').style.display = 'none';
    document.querySelector('#showContextMenuCommands').style.display = 'none';
  }

  loadOptions();

  {
    const url = new URL(location.href).searchParams.get('from') || "";
    const urlRegex = url ? `/^${utils.escapeRegExp(url, true)}$/` : "";
    const text = (url && urlRegex) ? `${url} (${urlRegex})` : "";
    document.querySelector('#urlInfo').textContent = text;
  }

  document.querySelector('#resetButton').addEventListener('click', (event) => {
    event.preventDefault();
    if (!confirm(utils.lang("resetConfirm"))) {
      return;
    }
    return utils.clearOptions().then(() => {
      return loadOptions();
    });
  });

  document.querySelector('#submitButton').addEventListener('click', (event) => {
    event.preventDefault();
    return saveOptions().then(() => {
      return quit();
    });
  });
});
