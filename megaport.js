/* jshint -W083 */
var mp = (function () {
  var exports = function (baseurl) {
    var innerthis = this;
    var onready = [],
      failauth, authUrl, authParams;
    this.credentials = {};


    var xhr = new xhreq();
    q = new que();

    this.auth = function (obj) {
      if (typeof obj.username == 'string' && typeof obj.password == 'string') {
        authUrl = baseurl + '/login';
        authParams = {
          username: obj.username,
          password: obj.password
        };
      } else if (typeof obj.token == 'string') {
        authUrl = baseurl + '/login/' + obj.token;
        authParams = {};
      } else if (typeof obj.access_token == 'string' && typeof obj.network == 'string') {
        authUrl = baseurl + '/social/login/' + obj.network;
        authParams = {
          access_token: obj.access_token,
          //redirect_uri: location.origin
        };
      }
      //console.log(authParams,authUrl);
      if (!authUrl || !authParams) return false;
      xhr.post(authUrl, authParams).then(
        function (d) {
          innerthis.credentials = d.data;

          if (typeof onready == 'object') {
            for (var oR in onready)
              if (typeof onready[oR] == 'function')
                onready[oR](innerthis.credentials);

            console.log('Login Success');
          }

          q.ready();
        },
        function (d) {
          console.warn('Login Failed, constructor useless ' + d.status);
          console.log(d);
          if (d.status == 401)
            if (typeof failauth == 'function')
              failauth();
        }
      );
    };

    // /secure/dropdowns/locations
    this.ready = function (cb) {
      onready.push(cb);
      if (typeof innerthis.credentials.token == 'string')
        cb(innerthis.credentials);
      return innerthis;
    };

    this.failauth = function (cb) {
      failauth = cb;
    };

    this.destroy = function (cb) {
      auth = {};
      if (typeof cb == 'function')
        cb(cb);
    };


    this.dashboard = function (ext) {
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/dashboard' + (ext ? '/' + ext : ''), {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data);
              },
              function (d) {
                reject(d);
                console.log(d);
              }
            );
        });
      });
    };

    this.menuStats = function () {
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/menuStats', {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data);
              },
              function (d) {
                reject(d);
                console.log(d);
              }
            );
        });
      });
    };

    this.tickets = function (status, dothis) {

      if (typeof status == 'object') {
        return new Promise(function (resolve, reject) {
          q.onready(function () {
            xhr.post(baseurl + '/ticket', status, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data);
                },
                function (d) {
                  reject(d);
                  console.log(d);
                }
              );
          });
        });
      }

      if (typeof status == 'number') {
        return new Promise(function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/ticket/' + status, {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data);
                },
                function (d) {
                  reject(d);
                  console.log(d);
                }
              );
          });
        }, {
          comment: function (message) {
            return new Promise(function (resolve, reject) {
              q.onready(function () {
                xhr.post(baseurl + '/ticket/' + status + '/comment', {
                    comment: message
                  }, innerthis.credentials.token)
                  .then(
                    function (d) {
                      resolve(d.data);
                    },
                    function (d) {
                      reject(d);
                      console.log(d);
                    }
                  );
              });
            });
          },
          close: function (message) {
            return new Promise(function (resolve, reject) {
              q.onready(function () {
                xhr.put(baseurl + '/ticket/' + status + '/close', {}, innerthis.credentials.token)
                  .then(
                    function (d) {
                      resolve(d);
                    },
                    function (d) {
                      reject(d);
                      console.log(d);
                    }
                  );
              });
            });
          }
        });
      }

      status = status || 'ANY';
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/ticket', {
              status: status
            }, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data);
              },
              function (d) {
                reject(d);
                console.log(d);
              }
            );
        });
      });
    }


    this.ixp = function (peerid, rsid, productid) {
      var url = (peerid ? '/ixp/' + peerid + '/peers' : '/ixp');
      if (peerid && rsid && productid)
        url = '/ixp/' + peerid + '/' + rsid + '/product/' + productid + '/prefixes';
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + url, {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data);
              },
              function (d) {
                reject(d);
                console.log(d);
              }
            );
        });
      });
    };

    this.ixpGraph = function (productid, to, from) {
      var url = '/graph';
      var pObj = {
        productId: productid,
      };


      if (!to)
        pObj.to = new Date().getTime();
      if (!from)
        pObj.from = pObj.to - 86400000;

      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + url, pObj, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data);
              },
              function (d) {
                reject(d);
                console.log(d);
              }
            );
        });
      });
    };


    this.servicegroups = function () {
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/servicegroups', {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data);
              },
              function (d) {
                reject(d);
                console.log(d);
              }
            );
        });
      });
    };

    this.product = function (productId, obj) {
      // /v2/dropdowns/locations
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/product/' + productId, {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data);
              },
              function (d) {
                console.log(d);
              }
            );
        });
      });
    };

    this.locations = function () {
      // /v2/dropdowns/locations

      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/dropdowns/locations', {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data);
              },
              function (d) {
                console.log(d);
              }
            );
        });
      });
    };

    this.market = function (id, obj) {
      if (typeof id == 'object' && !obj) {
        return new Promise(function (resolve, reject) {
          q.onready(function () {
            xhr.post(baseurl + '/market/' + id, obj, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d);
                },
                function (d) {
                  reject(d);
                }
              );
          });
        });
      }
      if (typeof id == 'number' && typeof obj == 'object') {
        return new Promise(function (resolve, reject) {
          q.onready(function () {
            xhr.put(baseurl + '/market/' + id, obj, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d);
                },
                function (d) {
                  reject(d);
                }
              );
          });
        });
      }
      if (typeof id == 'number' && !obj) {
        return new Promise(function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/market/' + id, {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data);
                },
                function (d) {
                  reject(d);
                }
              );
          });
        });
      }
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/market', {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data);
              },
              function (d) {
                reject(d);
              }
            );
        });
      });
    };

    this.company = function (obj) {
      if (obj) {
        return new Promise(function (resolve, reject) {
          q.onready(function () {
            xhr.put(baseurl + '/company', obj, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d);
                },
                function (d) {
                  reject(d);
                }
              );
          });
        });
      }
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/company', {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data);
              },
              function (d) {
                reject(d);
              }
            );
        });
      });
    };

    this.employment = function (obj) {
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/employment', {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data);
              },
              function (d) {
                reject(d);
              }
            );
        });
      });
    };

    this.profile = function (obj) {

      if (typeof obj == 'object') {
        return new Promise(function (resolve, reject) {
          q.onready(function () {
            xhr.put(baseurl + '/employee/' + innerthis.credentials.personId, obj, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d);
                },
                function (d) {
                  reject(d);
                }
              );
          });
        });
      } else {
        return new Promise(function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/employee/' + innerthis.credentials.personId, {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data);
                },
                function (d) {
                  reject(d);
                }
              );
          });
        });
      }

    }


    this.register = function (obj) {
      // https://git.megaport.com/snippets/82

      return new Promise(function (resolve, reject) {
        xhr.post(baseurl + '/social/registration', obj)
          .then(
            function (d) {
              resolve(d.data);
            },
            function (d) {
              reject(d);
            }
          );
      });
    }
  };



  // que things that run prior to ready state;
  function que(callback) {
    var state = false;
    var qued = [];

    this.onready = function (callback) {
      if (state === false)
        qued.push(callback);
      else
        callback();
    };

    this.ready = function () {
      state = true;
      for (var f in qued) {
        if (typeof qued[f] == 'function')
          qued[f]();
      }
      qued = [];
    };
  }

  // simple promise buider
  function Promise(fn, additional) {
    var state = 'pending';
    var value;
    var deferred = null;

    function resolve(newValue) {
      if (newValue && typeof newValue.then === 'function') {
        newValue.then(resolve, reject);
        return;
      }
      state = 'resolved';
      value = newValue;

      if (deferred) {
        handle(deferred);
      }
    }

    function reject(reason) {
      state = 'rejected';
      value = reason;

      if (deferred) {
        handle(deferred);
      }
    }

    function handle(handler) {
      if (state === 'pending') {
        deferred = handler;
        return;
      }

      var handlerCallback;

      if (state === 'resolved') {
        handlerCallback = handler.onResolved;
      } else {
        handlerCallback = handler.onRejected;
      }

      if (!handlerCallback) {
        if (state === 'resolved') {
          handler.resolve(value);
        } else {
          handler.reject(value);
        }

        return;
      }

      var ret = handlerCallback(value);
      handler.resolve(ret);
    }

    this.then = function (onResolved, onRejected) {
      return new Promise(function (resolve, reject) {
        handle({
          onResolved: onResolved,
          onRejected: onRejected,
          resolve: resolve,
          reject: reject
        });
      });
    };

    for (var func in additional)
      if (typeof additional[func] == 'function')
        this[func] = additional[func];

    fn(resolve, reject);
  }

  var xhreq = function () {
    var innerthis = this;

    this.ajax = function (method, url, params, token) {
      return new Promise(function (resolve, reject) {
        method = method.toUpperCase();

        if (typeof token == 'string')
          url += '?token=' + token;

        if (method == 'GET') {
          if (typeof params == 'object') {
            var querystr = (function (obj) {
              var str = [];
              for (var p in obj)
                if (obj.hasOwnProperty(p))
                  str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));

              return str.join("&");
            })(params);
            url += '&' + querystr;
          }
        }

        var rq = new XMLHttpRequest();

        rq.open(method, url, true);
        rq.onload = function () {
          if (rq.status == 200) {
            resolve(JSON.parse(rq.responseText));
          }
          if (rq.status > 200) {
            reject(JSON.parse(rq.responseText));
          }
          if (rq.status == 400) {

          }
        };
        rq.onerror = function () {};
        if (method == 'POST') {
          rq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
          if (typeof params == 'object') {
            params = (function (obj) {
              var str = [];
              for (var p in obj)
                if (obj.hasOwnProperty(p))
                  str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));

              return str.join("&");
            })(params);
          }
          rq.send(params);
        } else if (method == 'PUT') {
          rq.setRequestHeader('Content-Type', 'application/json');
          rq.send(JSON.stringify(params));
        } else {
          rq.send();
        }
      });
    };

    this.get = function (url, params, token) {
      return innerthis.ajax('GET', url, params, token);
    };
    this.post = function (url, params, token) {
      return innerthis.ajax('POST', url, params, token);
    };
    this.put = function (url, params, token) {
      return innerthis.ajax('PUT', url, params, token);
    };
  };

  return exports;
})();

if (typeof module == 'object')
  module.exports = mp;
