# nodejs模块学习： connect2 解析
nodejs 发展很快，从 npm 上面的包托管数量就可以看出来。不过从另一方面来看，也是反映了 nodejs 的基础不稳固，需要开发者创造大量的轮子来解决现实的问题。

知其然，并知其所以然这是程序员的天性。所以把常用的模块拿出来看看，看看高手怎么写的，学习其想法，让自己的技术能更近一步。

## 引言
[上一篇文章](http://www.cnblogs.com/htoooth/p/7116480.html)中，我讨论了 connect 模块，它做为 http 的中间件，设计得很灵活，接口设计也很少，非常便于使用。

其实 connect 模块的思想就是把 http 请求和回应看成流水线，而中间件则是流水线上的处理器，满足路由匹配，则调用相应的方法，直到结果返回。

我就在想，这套思想能不能用在别的地方？ 如 rpc, tcp 的请求处理，它们也都是一问一答的模式，也都可以抽象成流水线的模式进行处理，每个中间件对其中的数据进行处理，最后把结果返回了。

在仔细研究了 connect 的源码的基础上，我精减了部分代码，拿掉了 http 部分， 还有 url 匹配的部分，保留最有用的部分，同时增加了参数化配置和上下文环境。

于是就有了： [connect2](https://www.npmjs.com/package/connect2)这个模块，最小化 connect 的功能，保留了 next 和错识处理等已知的概念，没有带它的功能。它可以做为一个基础的模块嵌入到一个 rpc，tcp , http 中去，然后利用中间件的思想去完成你的业务。

下面，就仔细说说，我对它的考虑和使用说明。

## 解析
我对该模块的第一个考虑就是，他的实现跟某种协议无关。可以看看 connect2 的使用方法：

```js
var connect = require('connect2');

var app = connect();

app.use(function(ctx, req, res, next){
  console.log('md1')
  next()
});

app.use(function(ctx, req, res) {
  console.log('md2')
  next()
})

function main() {
  let context = {};
  let req = {};
  let res = {};

  app(context, req, res);
}

main();
```

可以看出，基本使用的方法于 connect 的模块相同，但是已经没有调用 http 的服务器了，它能在一个普通的函数中调用。

同时，多了一个 context， 这个我觉得挺重要的，用 express 做项目时，要跟踪请求全链路的路径，这在 java 中还好办，有 ThreadLocal 。这在 nodejs 中没有什么很好的办法，只能通过参数的形式，把 requestId 传下去。而 context 就是放这一类参数很好的地方。

有了这个 context 还可以把 协议 上下文也放到里面，实现更有用的功能。

导出函数是这样写的：

```js
function createServer(opts) {
  function app (ctx, req, res, next) { app.handle(ctx, req, res, next)}

  Object.assign(app, proto);
  Object.assign(app, opts);
  Object.assign(app, EventEmitter.prototype);
  app.stack = [];
  app.route = '';
  return app;
}
```

多了一个配置的 opts，会把 opts 的属性复制到 app 上面。后面会说一下有哪些方法可以配置。

而 use 方法也是基本没有怎么改变，删除了 http 的部分：

```js
proto.use = function(route, fn) {
  let handle = fn;
  let path = route;

  if (typeof route !== 'string') {
    handle = route;
    path = '';
  }

  if (typeof handle.handle === 'function') {
    let server = handle;
    server.route = path;

    handle = function(ctx, req, res, next) {
      server.handle(ctx, req, res, next);
    };
  }

  this.stack.push({handle: handle, route: path});
}

```

下面说说其中的核心 handle 功能：

```js
proto.handle = function(ctx, req, res, out) {
  let i = 0;
  let done = out || (this.finalHandler && this.finalHandler(ctx, req, res)) || NOOP;
  let dispatchContext = (this.dispatchContext && this.dispatchContext()) || {};
  let self = this;

  Object.assign(ctx, {
    app: this,
    req: req,
    res: res
  })

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
```

任何请求都有一个结束， 在 connect 中使用的是 finalhanlder 模块，也只能处理 http 问题，这里我们与 协议无关，因此这里就需要留下 一个接口，这个接口就通过 opts 进行配置的。

另外还有匹配参数的方法，`dispatch` 这块是把 url 参数匹配的算法移出，通过初始化参数的形式返回。

更多的例子可以在 test/server.js 中找到。

## 总结

connect2 就是对 connect 的一个精减。针对的更加普遍的问题，对一些东西能进行流水线的形式进行处理，将变化写成中间件，然后对所以的数据进行处理，在合适的时候返回。

特别合适网络服务器，自定义协议的部分，想想，通过这个模块，除了底层的协议，跟 http 不一样，其他都一样，这样写业务是不是很爽呢？

很快就要把这个模块融入到一个项目中，还有想把该项目给 typescript 化。

[connect2 github](https://github.com/htoooth/mini-connect)