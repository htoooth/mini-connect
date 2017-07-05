const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('connect:dispatcher');

const proto = {};

function NOOP() {}

var defer = typeof setImmediate === 'function'
  ? setImmediate
  : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }

function createServer(opts) {
  function app (ctx, req, res, next) { app.handle(ctx, req, res, next)}

  Object.assign(app, proto);
  Object.assign(app, opts);
  Object.assign(app, EventEmitter.prototype);
  app.stack = [];
  app.route = '';
  return app;
}

proto.handle = function(ctx, req, res, out) {
  let i = 0;
  let done = out || (this.finalHandler && this.finalHandler(ctx, req, res)) || NOOP;
  let dispatchContext = (this.dispatchContext && this.dispatchContext()) || {};
  let self = this;

  let next = function(err) {
    let layer = self.stack[i++]

    if (!layer) {
      defer(done, err)
      return;
    }

    if (layer.route && self.dispatch && !self.dispatch(dispatchContext, layer.route, req)) {
      return next(err)
    }

    debug('use %s %s', layer.route || 'none', layer.handle.name || 'anonymous');
    call(layer.handle, layer.route, err, ctx, req, res, next);
  }

  next();
}

proto.use = function(route, fn) {
  if (typeof route !== 'string') {
    fn = route;
    route = '';
  }

  this.stack.push({handle: fn, route});
}

function call(handle, route, err, ctx, req, res, next) {
  let arity = handle.length;
  let error = err;

  try {
    if (err && arity === 5) {
      handle(err, ctx, req, res, next);
      return;
    } else if (!err && arity < 5) {
      handle(ctx, req, res, next);
      return;
    }
  } catch (e) {
    error = e;
  }

  next(error);
}

module.exports = createServer;