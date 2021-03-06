# connect2

  connect2 is an extensible framework for [node](http://nodejs.org) using "plugins" known as _middleware_ like [connect](https://github.com/senchalabs/connect).

  [中文版说明](./README_ZH.md)

```js
var connect = require('connect2');

var app = connect();

app.use(function(ctx, req, res, next){
  console.log('md1')
  next()
});

app.use(function(ctx, req, res) {
  console.log('md2')
})

function main() {
  let context = {};
  let req = {};
  let res = {};

  app(context, req, res);
}

main();
```

## Getting Started

Connect is a simple framework to glue together various "middleware" to handle something like request, tcp, rpc.

### Install Connect

```sh
$ npm install connect2
```

### Create an app

The main component is a Connect "app". This will store all the middleware
added and is, itself, a function.

```js
var app = connect();
```

### Use middleware

The core of Connect is "using" middleware. Middleware are added as a "stack"
where incoming requests will execute each middleware one-by-one until a middleware
does not call `next()` within it.

```js
app.use(function middleware1(ctx, req, res, next) {
  // middleware 1
  next();
});
app.use(function middleware2(ctx, req, res, next) {
  // middleware 2
  next();
});
```

### Mount middleware

The `.use()` method also takes an optional string that is matched against
the beginning of the data.

```js
app.use('afunc', function fooMiddleware(ctx, req, res, next) {
  // req.url starts with "/foo"
  next();
});
app.use('bfunc', function barMiddleware(ctx, req, res, next) {
  // req.url starts with "/bar"
  next();
});
```

### Error middleware

There are special cases of "error-handling" middleware. There are middleware
where the function takes exactly 4 arguments. When a middleware passes an error
to `next`, the app will proceed to look for the error middleware that was declared
after that middleware and invoke it, skipping any error middleware above that
middleware and any non-error middleware below.

```js
// regular middleware
app.use(function (ctx, req, res, next) {
  // i had an error
  next(new Error('boom!'));
});

// error middleware for errors that occurred in middleware
// declared before this
app.use(function onerror(err,ctx, req, res, next) {
  // an error occurred!
});
```
## API

The connect2 API is very similar to connect.

When the `connect2` module is required, a function is returned that will construct
a new app when called.

```js
// require module
var connect = require('connect2')

// create app
var app = connect([opts])
```

### connect([opts])

The `opts` object has three functions: `finalHandler(ctx, req, res)`, `dispatch(dispatchCtx, route, req)` and `dispatchContext()`. The `finalHandle`
function must be return a function `function(err){...}`. The returned function is the last function in connect2 middleware. It can handle error. The `dispatch`
function return a `Boolean` value. if it return `true`, call this middleware 's `handle` or `fn`, else skip. The `dispatchContext` function return a object what pass to `dispatch` function as first parameter. You can give some status in it. you can find whole declare in `test\server.js`. The `defaultRoute` function set route initial value. The app's default route is `empty string` `''`. You can change it to `/` or anything you want. Hare are some code:

```js
var app = connect({
  finalHandler: (ctx, req, res) => {
    return function(err) {
      // do something
    }
  },
  dispatch: (ctx, route, req) => {
    return true;
  },
  dispatchContext: function() {
    return {};
  },
  defaultRoute: function() {
    // default value is `empty string`;
    return '/';
  }
})
```

### app(ctx, req, res[, next])

The `app` itself is a function. This is just an alias to `app.handle`.

### app.handle(ctx, req, res[, out])

Calling the function will run the middleware stack against the given Node.js
http request (`req`) and response (`res`) objects. An optional function `out`
can be provided that will be called if the request (or error) was not handled
by the middleware stack.

### app.use(fn)

Use a function on the app, where the function represents a middleware. The function
will be invoked for every request in the order that `app.use` is called. The function
is called with three arguments:

```js
app.use(function (ctx, req, res, next) {
})
```

In addition to a plan function, the `fn` argument can also be a Node.js HTTP server
instance or another Connect app instance.

### app.use(route, fn)

Use a function on the app, where the function represents a middleware. The function
will be invoked for every request in which the string starts with
the given `route` string in the order that `app.use` is called. The function is
called with three arguments:

```js
app.use('afunc', function (ctx, req, res, next) {
})
```
## License

[MIT](LICENSE)


## Thanks

Thanks for [connect](https://github.com/senchalabs/connect).