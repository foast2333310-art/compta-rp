(function() {

if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

var _cache = {};
var _serverOk = true;
var _keys = ['compta_declarations','compta_base','compta_blocnotes','compta_produits','compta_commandes','compta_notifications','compta_darkmode','compta_colors','compta_messages','compta_codes','compta_promo','compta_produits_added'];

function loadFromServer() {
  try {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/data/all', false);
    xhr.send();
    if (xhr.status === 200) { _cache = JSON.parse(xhr.responseText); return true; }
  } catch(e) {}
  return false;
}

_serverOk = loadFromServer();

setInterval(function() {
  fetch('/api/data/keepalive').catch(function(){});
}, 120000);

var _writeCount = 0;
var _origSetItem = origSetItem;

setInterval(function() {
  if (!_serverOk) return;
  fetch('/api/data/all').then(function(r) { if (!r.ok) throw Error(); return r.json(); }).then(function(data) {
    var changed = false;
    _keys.forEach(function(k) {
      if (data[k] !== undefined && data[k] !== _cache[k]) {
        _cache[k] = data[k];
        _origSetItem(k, data[k]);
        changed = true;
      }
    });
    if (changed) {
      try { window.dispatchEvent(new CustomEvent('store-sync')); } catch(e) {}
    }
  }).catch(function(){});
}, 2000);

var origGetItem = localStorage.getItem.bind(localStorage);
var origSetItem = localStorage.setItem.bind(localStorage);
var origRemoveItem = localStorage.removeItem.bind(localStorage);

localStorage.getItem = function(key) {
  if (!_serverOk) return origGetItem(key);
  if (_keys.indexOf(key) >= 0 && key in _cache) return _cache[key];
  var val = origGetItem(key);
  if (val !== null && _keys.indexOf(key) >= 0) {
    _cache[key] = val;
    origSetItem(key, val);
    fetch('/api/data/' + encodeURIComponent(key), { method: 'POST', body: val }).catch(function(){});
  }
  return val;
};

localStorage.setItem = function(key, value) {
  if (_keys.indexOf(key) >= 0) _cache[key] = value;
  origSetItem(key, value);
  if (_serverOk && _keys.indexOf(key) >= 0) {
    fetch('/api/data/' + encodeURIComponent(key), { method: 'POST', body: value }).catch(function(){});
  }
};

localStorage.removeItem = function(key) {
  if (_keys.indexOf(key) >= 0) delete _cache[key];
  origRemoveItem(key);
  if (_serverOk && _keys.indexOf(key) >= 0) {
    fetch('/api/data/' + encodeURIComponent(key), { method: 'DELETE' }).catch(function(){});
  }
};

})();
