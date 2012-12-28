var observable = function (base) {
	var eventListenersByType = {};
	base.addEventListener = function (type, listener, priority) {
		if (!listener) {
			listener = type;
			type = 'DefaultType';
		}
		if (!priority) {
			priority = 0;
		}
		eventListenersByType[type] = eventListenersByType[type] || [];
		eventListenersByType[type][priority] = eventListenersByType[type][priority] || [];
		eventListenersByType[type][priority].push(listener);
	};
	base.listeners = function (type) {
		var listenersByType = eventListenersByType[type || 'DefaultType'] || [],
		result = [], i;
		for (i = listenersByType.length - 1; i >= 0; i -= 1) {
			Array.prototype.push.apply(result, listenersByType[i]);
		}
		return result;
	};
	base.removeEventListener=function(type,listener){
		if (!listener) {
			listener = type;
			type = 'DefaultType';
		}
		if (eventListenersByType[type]){
			eventListenersByType[type]=eventListenersByType[type].filter(function(x){x!=listener;});
		}
	};
	base.dispatchEvent = function () {
		var eventArguments, eventType, listeners, i;
		if (arguments.length === 1) {
			eventArguments = arguments;
			eventType = 'DefaultType';
		} else {
			eventArguments = Array.prototype.slice.call(arguments, 1);
			eventType = arguments[0];
		}
		listeners = base.listeners(eventType);
		for (i = 0; i < listeners.length; i += 1) {
			try {
				if (listeners[i].apply(base, eventArguments) === false) {
					break;
				}
			} catch (e) {
				console.log(e);
//				setTimeout(function () {
//					throw e;
//				}, 0);
			}
		}
	};
	return base;
};
