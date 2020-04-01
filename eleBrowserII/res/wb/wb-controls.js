// JS for web browser controls

// Security (super important!)
// ESLint will warn about any use of eval(), even this one
// eslint-disable-next-line
window.eval = global.eval = function () {
  console.warn(`Sorry, this app does not support window.eval().`);
}

// DEBUG: Devtron
try {
  const devtron = require('devtron');
  devtron.install();
} catch (err) {}

function onLoad() {
  // Modules
  const electron = require('electron');
  const {webFrame} = electron;
  const remote = electron.remote;
  const currentWindow = remote.getCurrentWindow();
  
  // We only want the webview to zoom, so don't allow zooming of the browser chrome.
  webFrame.setZoomFactor(1);
  webFrame.setVisualZoomLevelLimits(1, 1);
  webFrame.setLayoutZoomLevelLimits(0, 0);
  
  // Don't let the address bar form reload the page
  var form = document.getElementById('addressForm');
  function handleForm(event) {
    event.preventDefault();
  }
  form.addEventListener('submit', handleForm);
  
  // WebView navigation events
  document.getElementById('app').addEventListener("did-start-loading", function() {
    startProgress();
	document.getElementById('favicon').src = './res/favicon/default.png';
	checkBtnStatus();
    document.getElementById('url').value = document.getElementById('app').getURL();
  });
  document.getElementById('app').addEventListener("did-stop-loading", function() {
    stopProgress();
    checkBtnStatus();
    document.getElementById('url').value = document.getElementById('app').getURL();
    addHistoryItem(document.getElementById('app').getURL());
  });
  document.getElementById('app').addEventListener("dom-ready", function() {
	checkBtnStatus(true);
    // Electron context menus
    require('electron-context-menu')({
	  window: document.getElementById('app')
    });
  });
  document.getElementById('app').addEventListener('did-fail-load', function (result) {
	var notification = document.querySelector('.mdl-js-snackbar');
	var data = {message: `${result.errorDescription} (${result.errorCode})`};
    notification.MaterialSnackbar.showSnackbar(data);
  });
  
  // Webpage events
  document.getElementById('app').addEventListener("page-title-updated", function(result) {
    setWindowTitle(result.title);
  });
  document.getElementById('app').addEventListener("page-favicon-updated", function(result) {
    setFavicon(result.favicons[0]);
  });
  
  // Keyhandlers
  document.addEventListener("keydown", event => {
    // Test: https://developer.mozilla.org/samples/domref/fullscreen.html
	switch (event.key) {
	  case "F11":
	    if (remote.getCurrentWindow().isFullScreen()) {
		  document.getElementById('app').executeJavaScript('document.webkitExitFullscreen()');
        }
		break;
      case "Escape":
        if (remote.getCurrentWindow().isFullScreen()) {
          remote.getCurrentWindow().setFullScreen(false);
        }
		document.getElementById('app').executeJavaScript('document.webkitExitFullscreen()');
        break;
    }
  });
  
  // Fullscreen API handlers
  document.getElementById('app').addEventListener("enter-html-full-screen", function() {
	if (!currentWindow.isMenuBarAutoHide()) {
      currentWindow.setAutoHideMenuBar(true);
	  currentWindow.setMenuBarVisibility(false);
    }
    document.getElementById('omnibox-header').style.display = 'none';
	document.getElementById('wb-viewarea-container').style.height = '100vh';
	var notification = document.querySelector('.mdl-js-snackbar');
	var data = {message: 'Press Esc to exit full screen'};
    notification.MaterialSnackbar.showSnackbar(data);
  });
  document.getElementById('app').addEventListener("leave-html-full-screen", function() {
	if (currentWindow.isMenuBarAutoHide()) {
	  currentWindow.setAutoHideMenuBar(false);
      currentWindow.setMenuBarVisibility(true);
    }
	document.getElementById('omnibox-header').style.display = 'block';
	document.getElementById('wb-viewarea-container').style.height = null;
  });
  
  // Load homepage
  document.getElementById('app').src = getPreferences()[0];
}
// Basic navigation functions
function iframeBack() {
  document.getElementById('app').goBack();
}

function iframeForward() {
  document.getElementById('app').goForward();
}

function iframeReload() {
  location.hash = '';
  document.getElementById('app').reload();
}

function iframeStop() {
  location.hash = '';
  document.getElementById('app').stop();
}

function iframeGo() {
  location.hash = '';
  // NEW: Omnibox
  var url = document.getElementById('url').value;
  if (url.indexOf(':') !== -1) {
	// Don't do anything with the URL.
  } else if (url.indexOf('.') !== -1) {
	url = 'http://' + url;
  } else {
	url = getPreferences()[1] + url;
  }
  document.getElementById('app').loadURL(url);
}

function getCurrentURL() {
  return document.getElementById('app').getURL();
}

// progress bar
function startProgress() {
  document.getElementById('progressbar').style.display = 'block';
}

function stopProgress() {
  document.getElementById('progressbar').style.display = 'none';
}
// buttons
function checkBtnStatus(domready) {
  if (domready) {
    if (document.getElementById('app').canGoBack()) {
      document.getElementById('back').disabled = false;
    } else {
      document.getElementById('back').disabled = true;
    }
    if (document.getElementById('app').canGoForward()) {
      document.getElementById('forward').disabled = false;
    } else {
      document.getElementById('forward').disabled = true;
    }
  }
  if (document.getElementById('app').isLoading()) {
    document.getElementById('reload').style.display = 'none';
    document.getElementById('stop').style.display = 'block';
  } else {
    document.getElementById('reload').style.display = 'block';
    document.getElementById('stop').style.display = 'none';
  }
  if (location.hash != '#history') {
    document.getElementById('open-history').style.visibility = 'visible';
  }
}
// history
function goFromHistory(url) {
  document.getElementById('url').value = url;
  iframeGo();
}

function addHistoryItem(url) {
  document.getElementById('clear-history').disabled = false;
  document.getElementById('no-history-msg').style.display = 'none';
  var today = new Date();
  var dd = today.getDate();
  var jsmm = today.getMonth();
  var mm = jsmm + 1; // Fix JavaScript months, which are base 0 instead of base 1
  var cent = today.getYear();
  var yy = 1900 + cent;
  var hh = today.getHours();
  var h = ((hh + 11) % 12 + 1);
  var suffix = (hh >= 12) ? 'PM' : 'AM';

  function checkMins(i) {
    if (i < 10) {
      i = '0' + i;
    } // add zero in front of numbers < 10
    return i;
  }
  var m = checkMins(today.getMinutes());
  document.getElementById('history-list').innerHTML = `<li class="mdl-list__item"><span class="mdl-list__item-primary-content"><i class="material-icons mdl-list__item-icon">history</i><img alt=" " class="wb-favicon" height="16" src="${getFavicon()}" width="16"><a href="javascript:goFromHistory('${url}');" title="${url}">${getWindowTitle()}</a>&nbsp;&mdash;&nbsp;${mm}/${dd}/${yy} at ${h}:${m} ${suffix}</span><button class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-js-ripple-effect wb-float-right" onclick="removeHistoryItem(this);" type="button" title="Remove this item"><i class="material-icons">remove</i></button></li>` + document.getElementById('history-list').innerHTML;
}

function removeHistoryItem(item) {
  if (item.parentNode.parentNode.childElementCount === 1) {
	// Clear the history since there's only one item in the list.
    clearHistory();
  } else {
	// FIXME: This won't remove the item from the webview's history. It will only delete it from the list.
	item.parentNode.parentNode.removeChild(item.parentNode);
	var notification = document.querySelector('.mdl-js-snackbar');
    var data = {message: 'Removed history item'};
    notification.MaterialSnackbar.showSnackbar(data);
  }
}

function clearHistory() {
  document.getElementById('app').clearHistory();
  document.getElementById('history-list').innerHTML = '';
  document.getElementById('clear-history').disabled = true;
  document.getElementById('no-history-msg').style.display = 'block';
  checkBtnStatus(true);
  var notification = document.querySelector('.mdl-js-snackbar');
  var data = {message: 'Cleared history'};
  notification.MaterialSnackbar.showSnackbar(data);
}
// window title
function getWindowTitle() {
  return document.getElementById('app').getTitle();
}

function setWindowTitle(title) {
  if (title) {
	// Use the title string passed to the function.
    document.title = title + ' - eleBrowser II';
  } else {
	// If no URL is passed, use getWindowTitle() to get the window title.
	document.title = getWindowTitle() + ' - eleBrowser II';
  }
}
// favicon
function getFavicon() {
  if (document.getElementById('favicon').src) {
	return document.getElementById('favicon').src;
  } else {
	// FALLBACK: This is not guaranteed to work 100% of the time, but it does the job.
    return getCurrentURL().split('/').slice(0, 3).join('/') + '/favicon.ico';
  }
}

function setFavicon(url) {
  if (url) {
	// Use the URL passed to the function.
    document.getElementById('favicon').src = url;
  } else {
	// If no URL is passed, use getFavicon() to get the favicon URL.
	document.getElementById('favicon').src = getFavicon();
  }
}

// user preferences dialog
function showPreferencesDialog() {
	// Populate fields.
	document.getElementById('prefHomepage').parentElement.MaterialTextfield.change(getPreferences()[0]);
	document.getElementById('prefSearchPrefix').parentElement.MaterialTextfield.change(getPreferences()[1]);
	// Show dialog.
	document.getElementById('preferencesDialog').showModal();
}
function setHomepageToCurrentURL() {
	document.getElementById('prefHomepage').parentElement.MaterialTextfield.change(getCurrentURL());
}
function savePreferences() {
	var homepage = document.getElementById('prefHomepage').value;
	var searchPrefix = document.getElementById('prefSearchPrefix').value;
	if ((!homepage.length || homepage.indexOf(':') !== -1) && (!searchPrefix.length || searchPrefix.indexOf(':') !== -1)) {
	  var status = setPreferences(homepage, searchPrefix);
    } else {
	  var status = false;
    }
    if (status) {
	  document.getElementById('preferencesDialog').close();
	}
	var notification = document.querySelector('.mdl-js-snackbar');
    var data = {message: status?'Preferences saved':'Could not save preferences'};
    notification.MaterialSnackbar.showSnackbar(data);
}

// user preferences backend
function getPreferences() {
	if (!localStorage.getItem("homepage")) {
	  setPreferences('https://www.google.com/', null);
    }
	if (!localStorage.getItem("searchPrefix")) {
	  setPreferences(null, 'https://www.google.com/search?q=');
    }
	return [localStorage.homepage, localStorage.searchPrefix];
}

function setPreferences(homepage, searchPrefix) {
	if (homepage || homepage === "") {
	localStorage.setItem('homepage', homepage);
	}
	if (searchPrefix || searchPrefix === "") {
	localStorage.setItem('searchPrefix', searchPrefix);
	}
    return true;
}

function resetPreferences(silent) {
	if (silent) {
	  var resetPrompt = true;
	} else {
	  var resetPrompt = confirm('Are you sure you want to reset preferences? You cannot undo this action.');
	}
    switch(resetPrompt) {
      case true:
        localStorage.clear();
		if (!silent) {
		  document.getElementById('preferencesDialog').close();
		  var notification = document.querySelector('.mdl-js-snackbar');
          var data = {message: 'Successfully reset preferences'};
          notification.MaterialSnackbar.showSnackbar(data);
		}
        return true;
      default:
	    if (!silent) {
		  var notification = document.querySelector('.mdl-js-snackbar');
          var data = {message: 'Reset canceled'};
          notification.MaterialSnackbar.showSnackbar(data);
		}
        return false;
    }
}