const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('connect2:dispatcher');

const proto = {};

function NOOP() {}

var defer = typeof setImmediate === 'function'
  ? setImmediate
  : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }

var DEFAULT_ROUTE = '';

function createServer(opts) {
  function app (ctx, req, res, next) { app.handle(ctx, req, res, next)}

  Object.assign(app, proto);
  Object.assign(app, opts);
  Object.assign(app, EventEmitter.prototype);
  app.stack = [];
  app.route = (app.defaultRoute && app.defaultRoute()) || DEFAULT_ROUTE;
  app.parent = null;
  return app;
}

proto.handle = function(ctx, req, res, out) {
  let i = 0;
  let done = out || (this.finalHandler && this.finalHandler(ctx, req, res)) || NOOP;
  let dispatchContext = (this.dispatchContext && this.dispatchContext()) || {};
  let self = this;

  Object.assign(ctx, {
    app: this
  });

  let next = function(err) {
    let layer = self.stack[i++]

    if (!layer) {
      defer(done, err)
      return;
    }

    Object.assign(req, {
      route: layer.route
    });

    if (layer.route && self.dispatch && !self.dispatch(dispatchContext, layer.route, req)) {
      return next(err)
    }

    debug('use %s %s', layer.route || 'none', layer.handle.name || 'anonymous');
    call(layer.handle, layer.route, err, ctx, req, res, next);
  }

  next();
}

proto.path = function() {
  return this.parent ? this.parent.route + this.route : this.route;
}

proto.use = function(route, fn) {
  let handles = Array.prototype.slice.call(arguments, 1);
  let path = route;
  let self = this;

  if (typeof route !== 'string') {
    handles = Array.from(arguments);
    path = (this.defaultRoute && this.defaultRoute()) || DEFAULT_ROUTE;
  }

  if (handles.length === 0) {
    throw new TypeError('app.use() requires middleware functions');
  }

  handles.forEach(function(handle) {
    if (typeof handle.handle === 'function') {
      let server = handle;
      server.route = path;
      server.parent = self;

      handle = function(ctx, req, res, next) {
        server.handle(ctx, req, res, next);
      };
    }

    self.stack.push({handle: handle, route: path});
  });
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