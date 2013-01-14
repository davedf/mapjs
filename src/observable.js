var observable = function (base) {
	'use strict';
	var eventListenersByType = {}, eventSinks = [];
	base.addEventListener = function (type, listener) {
		eventListenersByType[type] = eventListenersByType[type] || [];
		eventListenersByType[type].push(listener);
	};
	base.listeners = function (type) {
		var listenersByType = eventListenersByType[type] || [], result = [], i;
		for (i = listenersByType.length - 1; i >= 0; i -= 1) {
			result.push(listenersByType[i]);
		}
		return result;
	};
	base.removeEventListener = function (type, listener) {
		if (eventListenersByType[type]) {
			eventListenersByType[type] = eventListenersByType[type].filter(
				function (currentListener) {
					return currentListener !== listener;
				}
			);
		}
	};
	base.addEventSink = eventSinks.push.bind(eventSinks);
	base.dispatchEvent = function (eventType) {
		var eventArguments, listeners, i;
		eventArguments = Array.prototype.slice.call(arguments, 1);
		for (i = 0; i < eventSinks.length; i += 1) {
			eventSinks[i].apply(base, arguments);
		}
		listeners = base.listeners(eventType);
		for (i = 0; i < listeners.length; i += 1) {
			if (listeners[i].apply(base, eventArguments) === false) {
				break;
			}
		}
	};
	return base;
};
