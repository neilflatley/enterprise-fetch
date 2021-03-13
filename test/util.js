var handleEnter = (event) => {
  if (event.keyCode === 13 && !event.shiftKey) {
    document.getElementById('goFetch').click();
    event.preventDefault();
  }
};

var logTimestamp = () => '[' + new Date().toTimeString().substring(0, 8) + '] ';

var tryParse = (str) => {
  try {
    return typeof str === 'object' ? str : JSON.parse(str);
  } catch (e) {
    return false;
  }
};

var createContainer = () => {
  var div = document.createElement('div');
  div.setAttribute('class', 'flex-container');
  return div;
};
var createLabel = (labelFor, requestId) => {
  var label = document.createElement('label');
  var labelText = document.createTextNode(
    logTimestamp() + '[id:' + requestId + ']'
  );
  label.appendChild(labelText);
  label.setAttribute('for', labelFor);
  return label;
};

var appendLog = (message, requestId) => {
  var log = document.getElementById('log');
  var newmessage = document.createElement('div');

  newmessage.setAttribute('id', 'log-' + requestId);
  var text = document.createTextNode(message);
  newmessage.appendChild(text);
  var container = createContainer();
  container.appendChild(createLabel('log-' + requestId, requestId));
  container.appendChild(newmessage);
  log.appendChild(container);
};

var clearLog = () => {
  var log = document.getElementById('log');
  log.textContent = '';
};

var addResponse = (response, requestId) => {
  var responseBlock = document.getElementById('response');
  var newmessage = document.createElement('div');
  newmessage.setAttribute('id', 'response-' + requestId);
  var text = document.createTextNode(JSON.stringify(response, null, 2));
  newmessage.appendChild(text);
  var container = createContainer();
  container.appendChild(createLabel('response-' + requestId, requestId));
  container.appendChild(newmessage);
  responseBlock.appendChild(container);
  responseBlock.appendChild(document.createElement('br'));
};

var clearResponse = () => {
  var responseBlock = document.getElementById('response');
  responseBlock.textContent = '';
};

var autogrowTextarea = (that) => {
  that.parentNode.dataset.replicatedValue = that.value;
};
