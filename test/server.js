
var assert = require('assert');
var connect = require('..');

function main(fn) {
  var ctx = {};
  var req = {};
  var res = {
    value: ''
  };
  fn(ctx, req, res);
}

describe('app', function(){
  var app;

  beforeEach(function(){
    app = connect();
  });

  it('should inherit from event emitter', function(done){
    app.on('foo', done);
    app.emit('foo');
  });

  it('should route default value is empty string', function(done){
    assert.equal(app.route, '');
    done();
  });

  it('should change route default value', function(done){
    app = connect({
      defaultRoute() {
        return '/';
      }
    })

    assert.equal(app.route, '/');
    done();
  });

  it('should be a callable function', function(done){
    var app = connect();

    app.use(function (ctx, req, res, next) {
      res.value += 'hello, world!';
      next();
    });

    app.use(function (ctx, req, res) {
      assert.equal(res.value, 'oh, hello, world!');
      done();
    })

    function handler(ctx, req, res, next) {
      res.value += 'oh, ';
      app(ctx, req, res, next);
    }

    main(handler);
  })

  it('should invoke callback on error', function(done){
    app.use(function (ctx, req, res) {
      throw new Error('boom!');
    });

    app.use(function(err, ctx, req, res, next) {
      res.value += err.message;
      next();
    });

    function handler(ctx, req, res) {
      res.value += 'oh, ';
      app(ctx, req, res, function(err) {
        assert.equal(res.value, 'oh, boom!');
        done();
      });
    }

    main(handler);
  })

  it('should invoke finalHandler callback', function(done){
    // custom server handler array
    app = connect({
      finalHandler: (ctx, req, res) => {
        return () => {
          assert.equal(res.value, '123');
          done();
        }
      }
    });

    app.use(function(ctx, req, res, next) {
      res.value += '2';
      next();
    });

    app.use(function(ctx, req, res, next) {
      res.value += '3';
      next();
    });

    function handler(ctx, req, res){
      res.value = '1'
      app(ctx, req, res);
    }

    main(handler);
  });


  it('should invoke finalHandler callback', function(done){
    // custom server handler array
    app = connect({
      finalHandler: (ctx, req, res) => {
        return () => {
          assert.equal(res.value, '123');
          done();
        }
      }
    });

    app.use(function(ctx, req, res, next) {
      res.value += '2';
      next();
    });

    app.use(function(ctx, req, res, next) {
      res.value += '3';
      next();
    });

    function handler(ctx, req, res){
      res.value = '1'
      app(ctx, req, res);
    }

    main(handler);
  });


  it('should invoke dispatch callback', function(done){
    // custom server handler array
    app = connect({
      finalHandler: (ctx, req, res) => {
        return () => {
          assert.equal(res.value, '1234');
          done();
        }
      },
      dispatch: (ctx, route, req) => {
        if (route === '1')  {
          return true;
        } else if (route === '2') {
          return false;
        } else {
          return false;
        }
      }
    });

    app.use(function(ctx, req, res, next) {
      res.value += '2';
      next();
    });

    app.use('1' ,function(ctx, req, res, next) {
      res.value += '3';
      next();
    });

    app.use('2' ,function(ctx, req, res, next) {
      res.value += '5';
      next();
    });

    app.use(function(ctx, req, res, next) {
      res.value += '4';
      next();
    })

    function handler(ctx, req, res){
      res.value = '1'
      app(ctx, req, res);
    }

    main(handler);
  });

  it('should invoke route dispatch callback', function(done){
    // custom server handler array
    app = connect({
      finalHandler: (ctx, req, res) => {
        return () => {
          assert.equal(res.value, '1234');
          done();
        }
      },
      dispatch: (ctx, route, req) => {
        if (route === req.value) {
          return true;
        } else {
          return false;
        }
      }
    });

    app.use(function(ctx, req, res, next) {
      res.value += '2';
      next();
    });

    app.use('1' ,function(ctx, req, res, next) {
      res.value += '3';
      next();
    });

    app.use('2' ,function(ctx, req, res, next) {
      res.value += '5';
      next();
    });

    app.use(function(ctx, req, res, next) {
      res.value += '4';
      next();
    })

    function handler(ctx, req, res){
      req.value = '1';
      res.value = '1';
      app(ctx, req, res);
    }

    main(handler);
  });

  it('should invoke route dispatch with custom context', function(done){
    // custom server handler array
    app = connect({
      finalHandler: (ctx, req, res) => {
        return () => {
          assert.equal(res.value, '1234custom');
          done();
        }
      },
      dispatch: (ctx, route, req) => {
        if (route === req.value) {
          req._c = ctx.value;
          return true;
        } else {
          return false;
        }
      },
      dispatchContext: function() {
        return {
          value: 'custom'
        }
      }
    });

    app.use(function(ctx, req, res, next) {
      res.value += '2';
      next();
    });

    app.use('1' ,function(ctx, req, res, next) {
      res.value += '3';
      next();
    });

    app.use(function(ctx, req, res, next) {
      res.value += '4';
      res.value += req._c;
      next();
    })

    function handler(ctx, req, res){
      req.value = '1';
      res.value = '1';
      app(ctx, req, res);
    }

    main(handler);
  });
});
