import Ember from 'ember';
// TODO:
//   get rid of _
//   objectAt
//   Proxies only work in the future

// A proxy which prevents the use of .get, identifies itself as a
// proxy, and allows the wrapped object to be unwrapped
var handler = {
  get: function(target, arg) {
    if (arg === 'get') {
      return function() {
        throw new Error(
          `You may not use 'this.get' in a strict computed property`
        );
      };
    }

    if (arg === 'computedStrict__unProxiedObject') {
      return target;
    }

    if (arg === 'computedStrict__isAProxy') {
      return true;
    }

    return target[arg];
  }
};

function proxyIfPossible(value) {
  if (value instanceof Ember.Object) {
    return new Proxy(value, handler);
  }
  return value;
}

function unProxyIfNecessary(value) {
  if (value.computedStrict__isAProxy) {
    return value.computedStrict__unProxiedObject;
  }
  return value;
}

function getSingleProxiedDependency(object, name) {
  var value = Ember.get(object, name);
  return proxyIfPossible(value);
}

function getArrayProxiedDependency(object, arrayName, pieceName) {
  return Ember.get(object, arrayName).map((part) => {
    var piece = Ember.get(part, pieceName);
    return proxyIfPossible(piece);
  });
}


function getterForDependencyName(name) {
  // Strip .[] -- it doesn't matter for getting.
  name = name.replace(/\.\[\]$/, '');

  // Split on @each, so we know if we must map.
  var chunks = name.split('@each');

  // If no @each, we're done -- just return the value.
  if (chunks.length === 1) {
    return () => {
      return getSingleProxiedDependency(this, name);
    };
  }

  // If there was an each, map and accumulate.
  return () => {
    return getArrayProxiedDependency(this, chunks[0], chunks[1]);
  };
}

export default function computedStrict(...args) {
  var fn = args[args.length - 1];
  var names = args.slice(0, args.length - 1);

  var wrapper = function() {
    var values = _.map(names, getterForDependencyName, this);
    var proxy = proxyIfPossible(this);
    let computedReturn = fn.apply(proxy, values);
    return unProxyIfNecessary(computedReturn);
  };

  var newArgs = names.concat([wrapper]);
  return Ember.computed.apply(this, newArgs);
}
