/* jshint -W083, -W117  */
var mp = (function () {
  var cache = {};
  var exports = function (baseurl) {
    var innerthis = this;
    var onready = [],
      failauth, authUrl, authParams;
    this.credentials = {};


    var xhr = new xhreq();
    var q = new que();

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
      if (typeof cb == 'function')
        cb(cb);
    };


    this.dashboard = function (ext) {
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/dashboard' + (ext ? '/' + ext : ''), {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data || d);
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
                resolve(d.data || d);
              },
              function (d) {
                reject(d);
                console.log(d);
              }
            );
        });
      });
    };

    this.tickets = function (ticketId) {
      return {
        filter: function (status) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/ticket', {
                  status: status || 'ANY'
                }, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    reject(d);
                    console.log(d);
                  }
                );
            });
          });
        },
        comment: function (message) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.post(baseurl + '/ticket/' + ticketId + '/comment', {
                  comment: message
                }, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    reject(d);
                    console.log(d);
                  }
                );
            });
          });
        },
        close: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.put(baseurl + '/ticket/' + ticketId + '/close', {}, innerthis.credentials.token)
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
        },
        create: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.post(baseurl + '/ticket', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    reject(d);
                    console.log(d);
                  }
                );
            });
          });
        },
        then: (ticketId ? function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/ticket/' + ticketId, {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  reject(d);
                  console.log(d);
                }
              );
          });
        } : function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/ticket', {
                status: 'ANY'
              }, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  reject(d);
                  console.log(d);
                }
              );
          });
        })
      };
    };


    this.ixp = function (peerid, rsid, productid) {
      var url = (peerid ? '/ixp/' + peerid + '/peers' : '/ixp');
      if (peerid && rsid && productid)
        url = '/ixp/' + peerid + '/' + rsid + '/product/' + productid + '/prefixes';
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + url, {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data || d);
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
                resolve(d.data || d);
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
                resolve(d.data || d);
              },
              function (d) {
                reject(d);
                console.log(d);
              }
            );
        });
      });
    };

    this.ports = function () {
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/servicegroups', {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(srvcObj(d.data));
              },
              function (d) {
                reject(d);
                console.log(d);
              }
            );
        });
      });
    };

    this.ixTypes = function (locationId) {
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/product/ix/types', {
              locationId: locationId
            }, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data || d);
              },
              function (d) {
                reject(d);
                console.log(d);
              }
            );
        });
      });
    }



    this.product = function (productId) {
      // /v2/dropdowns/locations

      return {
        checkPrice: function (rateLimit) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              innerThis.then(function (productObj) {
                var type = '/' + productObj.productType.toLowerCase();
                if (type == '/megaport')
                  type = '';
                xhr.get(baseurl + '/product' + type + '/' + productId + '/checkPrice', {
                    rateLimit: rateLimit
                  }, innerthis.credentials.token)
                  .then(
                    function (d) {
                      resolve(d.data || d);
                    },
                    function (d) {
                      reject(d);
                      console.log(d);
                    }
                  );
              });
            });
          });
        },
        types: function () {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              innerThis.then(function (productObj) {
                var type = '/' + productObj.productType.toLowerCase();
                if (type == '/megaport')
                  type = '';
                xhr.get(baseurl + '/product' + type + '/' + productId + '/types', {}, innerthis.credentials.token)
                  .then(
                    function (d) {
                      resolve(d.data || d);
                    },
                    function (d) {
                      reject(d);
                      console.log(d);
                    }
                  );
              });
            });
          });
        },
        update: function (obj) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              innerThis.then(function (productObj) {
                var type = '/' + productObj.productType.toLowerCase();
                if (type == '/megaport')
                  type = '';
                xhr.put(baseurl + '/product' + type + '/' + productId, obj, innerthis.credentials.token)
                  .then(
                    function (d) {
                      resolve(d.data || d);
                    },
                    function (d) {
                      reject(d);
                      console.log(d);
                    }
                  );
              });
            });
          });
        },
        then: function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/product/' + productId, {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  reject(d);
                  console.log(d);
                }
              );
          });
        }
      };
    };

    this.lists = function (name) {

      // markets, locations

      var url = '/dropdowns/' + name;

      if (name == 'markets')
        url = '/supplier';

      if (name == 'locations')
        url = '/locations';

      if (name == 'partnerPorts')
        url = '/dropdowns/partner/megaports';

      // /v2/dropdowns/person/{personId}/megaports


      return new Promise(function (resolve, reject) {
        q.onready(function () {
          if (typeof cache[url] === 'object') {
            resolve(cache[url].data || cache[url]);
            return;
          }
          xhr.get(baseurl + url, {}, innerthis.credentials.token)
            .then(
              function (d) {
                cache[url] = d;
                resolve(d.data || d);
              },
              function (d) {
                console.log(d);
              }
            );
        });
      });
    }


    this.markets = function (marketId) {
      return {
        update: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.put(baseurl + '/market/' + marketId, obj, innerthis.credentials.token)
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
        },
        create: function (obj) {
          //  https://git.megaport.com/snippets/97
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.jpost(baseurl + '/market', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    reject(d);
                    console.log(d);
                  }
                );
            });
          });
        },
        delete: {}, // needs to be written
        then: (marketId ? function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/market/' + marketId, {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  reject(d);
                  console.log(d);
                }
              );
          });
        } : function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/market', {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  reject(d);
                  console.log(d);
                }
              );
          });
        })
      };
    };


    this.company = function (obj) {
      return {
        update: function (obj) {
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
        },
        then: function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/company', {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  reject(d);
                  console.log(d);
                }
              );
          });
        }
      };
    };

    this.employment = function (employmentId) {
      return {
        employ: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.post(baseurl + '/employment', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    reject(d);
                    console.log(d);
                  }
                );
            });
          });
        },
        delete: {}, // needs to be written
        then: (employmentId ? function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/employment/' + employmentId, {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  reject(d);
                  console.log(d);
                }
              );
          });
        } : function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/employment', {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  reject(d);
                  console.log(d);
                }
              );
          });
        })
      };
    };

    this.profile = function (obj) {
      return {
        update: function (obj) {
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
        },
        then: function (resolve, reject) {
          q.onready(function () {
            xhr.put(baseurl + '/employee/' + innerthis.credentials.personId, {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  reject(d);
                  console.log(d);
                }
              );
          });
        }
      };
    };

    this.priceBook = function () {
      return {
        megaport: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/pricebook/megaport', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    reject(d);
                    console.log(d);
                  }
                );
            });
          });
        },
        vxc: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/pricebook/vxc', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    reject(d);
                    console.log(d);
                  }
                );
            });
          });
        },
        ix: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/pricebook/ix', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    reject(d);
                    console.log(d);
                  }
                );
            });
          });
        }
      }
    }


    this.serviceOrder = function (serviceOrderUid) {
      return {
        save: function (title, obj) {

          var sendObj = {
            companyUid: innerthis.credentials.companyUid
          };
          if (typeof title == 'string') {
            sendObj.title = title;
            sendObj.serviceRequestObject = JSON.stringify(obj);
          } else {
            sendObj.serviceRequestObject = JSON.stringify(title);
            if (typeof serviceOrderUid != 'string') {
              sendObj.title = 'untitled';
            }
          }

          return new Promise(function (resolve, reject) {
            q.onready(function () {
              if (typeof serviceOrderUid == 'string') {
                xhr.put(baseurl + '/serviceorder/' + serviceOrderUid, sendObj, innerthis.credentials.token)
                  .then(
                    function (d) {
                      resolve(d.data || d);
                    },
                    function (d) {
                      reject(d);
                    }
                  );
              } else {
                xhr.jpost(baseurl + '/serviceorder', sendObj, innerthis.credentials.token)
                  .then(
                    function (d) {
                      resolve(d.data || d);
                    },
                    function (d) {
                      reject(d);
                    }
                  );
              }
            });
          });
        },
        then: function (resolve, reject) {
          q.onready(function () {
            var url, obj;
            if (typeof serviceOrderUid == 'string') {
              url = '/serviceorder/' + serviceOrderUid;
              obj = {};
            } else {
              url = '/serviceorders';
              obj = {
                companyUid: innerthis.credentials.companyUid
              };
            }

            xhr.get(baseurl + url, obj, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  reject(d);
                }
              );
          });
        }
      }
    };


    this.register = function (obj) {
      // https://git.megaport.com/snippets/82
      return new Promise(function (resolve, reject) {
        xhr.post(baseurl + '/social/registration', obj)
          .then(
            function (d) {
              resolve(d.data || d);
            },
            function (d) {
              reject(d);
            }
          );
      });
    };
  };


  // building the ports array
  function srvcObj(obj) {
    var megaports = {};
    if (typeof obj != 'object') return [];
    obj.map(function (e) {
      e.megaports.map(function (m) {
        megaports[m.productUid] = m;
      });
    });
    var arr = Object.keys(megaports).map(function (key) {
      return megaports[key];
    });
    return arr;
  }

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
          console.log(url);
        }

        var rq = new XMLHttpRequest();

        rq.open(method.replace('J', ''), url, true);

        rq.onload = function () {
          if (rq.status < 210) {

            resolve(JSON.parse(rq.responseText));
          }
          if (rq.status > 210) {
            reject(JSON.parse(rq.responseText));
          }
          if (rq.status == 400) {

          }
        };
        rq.onerror = function () {};

        switch (method) {

        case 'POST':
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
          break;
        case 'JPOST':
          rq.setRequestHeader('Content-Type', 'application/json');
          rq.send(JSON.stringify(params));
          break;

        case 'PUT':
          rq.setRequestHeader('Content-Type', 'application/json');
          rq.send(JSON.stringify(params));
          break;

        default:
          rq.send();

        }

        //        if (method == 'POST') {
        //          rq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        //          if (typeof params == 'object') {
        //            params = (function (obj) {
        //              var str = [];
        //              for (var p in obj)
        //                if (obj.hasOwnProperty(p))
        //                  str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        //
        //              return str.join("&");
        //            })(params);
        //          }
        //          rq.send(params);
        //        } else if (method == 'PUT') {
        //          rq.setRequestHeader('Content-Type', 'application/json');
        //          rq.send(JSON.stringify(params));
        //        } else {
        //          rq.send();
        //        }
      });
    };

    this.get = function (url, params, token) {
      return innerthis.ajax('GET', url, params, token);
    };
    this.post = function (url, params, token) {
      return innerthis.ajax('POST', url, params, token);
    };
    this.jpost = function (url, params, token) {
      return innerthis.ajax('JPOST', url, params, token);
    };
    this.put = function (url, params, token) {
      return innerthis.ajax('PUT', url, params, token);
    };
    this.delete = function (url, params, token) {
      return innerthis.ajax('DELETE', url, params, token);
    };
  };

  return exports;
})();
window.MP = mp;
if (typeof module == 'object')
  module.exports = mp;
