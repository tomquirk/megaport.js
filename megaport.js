/* jshint -W083, -W117  */
var mp = (function () {
  var cache = {};
  var onready = [],
    authUrl, authParams, errors,
    failauth = function () {},
    maintenance = function () {},
    hardfail = function () {};

  var exports = function (baseurl) {
    var innerthis = this;
    this.baseurl = baseurl;
    this.credentials = {};


    var xhr = new xhreq();
    var q = new que();

    this.auth = function (obj, success, fail) {
      if (typeof obj.username == 'string' && typeof obj.password == 'string') {
        authUrl = baseurl + '/login';
        authParams = {
          username: obj.username,
          password: obj.password,
          oneTimePassword: obj.oneTimePassword,
          resetPassword: obj.resetPassword
        };

        if (!authParams.oneTimePassword)
          delete authParams.oneTimePassword;

        if (!authParams.resetPassword)
          delete authParams.resetPassword;

        if (typeof obj.target_username == 'string')
          authParams.target_username = obj.target_username;

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
      xhr.post(authUrl, authParams, null, true).then(
        function (d) {
          innerthis.credentials = d.data;
          if (typeof success == 'function')
            success(d);
          if (typeof onready == 'object') {
            for (var oR in onready)
              if (typeof onready[oR] == 'function')
                onready[oR](innerthis.credentials);
            console.log('Login Success');
          }
          q.ready();
        },
        function (d) {
          if (typeof fail == 'function')
            fail(d);
          console.warn('Login Failed, constructor useless ' + d.status);
          console.log(d);
          if (d.status == 503)
            return maintenance();
          if (d.status == 401)
            if (typeof failauth == 'function')
              failauth(d);
        }
      );
    };

    this.reauth = function (cb) {
      authUrl = baseurl + '/login/' + innerthis.credentials.token;
      xhr.post(authUrl, {}).then(
        function (d) {
          innerthis.credentials = d.data;
          if (typeof cb == 'function')
            cb(d.data);
        }
      );
    };

    this.inAuth = function (obj) {
      var innerThis = this;
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.post(baseurl + '/login', obj, true)
            .then(
              function (d) {
                this.credentials = {};
                resolve(d.data || d);
              })
            .catch(reject);
        });
      });
    };

    this.logout = function () {
      var innerThis = this;
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/logout', {}, innerthis.credentials.token)
            .then(
              function (d) {
                innerThis.credentials = {};
                resolve(d.data || d);
              }
            )
            .catch(reject);
        });
      });
    };

    this.passwordRequest = function (email) {
      var innerThis = this;
      return new Promise(function (resolve, reject) {
        xhr.post(baseurl + '/password/reset/request', {
            email: email
          })
          .then(
            function (d) {
              innerThis.credentials = {};
              resolve(d.data || d);
            }
          ).catch(reject);
      });
    };

    this.passwordReset = function (resetToken, password) {
      var innerThis = this;
      return new Promise(function (resolve, reject) {
        xhr.post(baseurl + '/password/reset', {
            resetToken: resetToken,
            password: password
          })
          .then(
            function (d) {
              innerThis.credentials = {};
              resolve(d.data || d);
            }
          ).catch(reject);
      });
    };

    this.ready = function (cb) {
      onready.push(cb);
      if (typeof innerthis.credentials.token == 'string')
        cb(innerthis.credentials);
      return innerthis;
    };

    this.maintenance = function (cb) {
      maintenance = cb;
    };

    this.hardfail = function (cb) {
      hardfail = cb;
    };

    this.failauth = function (cb) {
      failauth = cb;
    };

    this.onerror = function (cb) {
      errors = cb;
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
              }
            ).catch(reject);
        });
      });
    };

    this.prompt = function (promptId) {
      return {
        update: function (status, rating, description) {
          return new Promise(function (resolve, reject) {
            xhr.put(baseurl + '/prompt/' + promptId + '?promptStatus=' + status + '&rating=' + rating + '&description' + encodeURI(description), {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d);
                },
                function (d) {
                  reject(d);
                  if (typeof errors == 'function')
                    errors(d);
                }
              );
          });
        },
        create: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.jpost(baseurl + '/prompt', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        then: (promptId ? function (resolve, reject) {
          xhr.get(baseurl + '/prompt/' + promptId, {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data || d);
              },
              function (d) {
                reject(d);
                if (typeof errors == 'function')
                  errors(d);
              }
            );
        } : function (resolve, reject) {
          xhr.get(baseurl + '/prompt', {}, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data || d);
              },
              function (d) {
                reject(d);
                if (typeof errors == 'function')
                  errors(d);
              }
            );
        })
      };
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
                if (typeof errors == 'function')
                  errors(d);

              }
            );
        });
      });
    };

    this.agency = function (agencyId) {
      agencyId = agencyId || innerthis.credentials.companyUid;
      return {
        createCustomer: function (custObj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.jpost(baseurl + '/agency/' + agencyId + '/customer', custObj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        customers: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/agency/' + agencyId + '/customer', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        createAgent: function (agentObj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.jpost(baseurl + '/agency/' + agencyId + '/agent', agentObj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        updateAgent: function (agentId, agentObj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.put(baseurl + '/agent/' + agentId, agentObj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        agent: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/agency/' + agencyId + '/agent', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        agentOverview: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/agency/' + agencyId + '/agent/overview', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        createSubAgency: function (agencyObj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.jpost(baseurl + '/agency/' + agencyId + '/subAgency', agencyObj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        subAgencies: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/agency/' + agencyId + '/subAgency', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        subAgenciesOverview: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/agency/' + agencyId + '/subAgency/overview', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        commissionReportCsv: function (obj) {
          obj = obj || {};
          var querystr = (function (obj) {
            var str = [];
            for (var p in obj)
              if (obj.hasOwnProperty(p))
                str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
            return str.join('&');
          })({
            billingMonth: obj.month,
            billingYear: obj.year
          });
          return baseurl + '/agency/' + agencyId + '/commissionReport/csv?token=' + innerthis.credentials.token + '&' + querystr;
        },
        commissionReport: function (obj) {
          obj = obj || {};
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/agency/' + agencyId + '/commissionReport', {
                  billingMonth: obj.month,
                  billingYear: obj.year
                }, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        }
      };
    };


    this.ixp = function (ixpid) {
      return {
        then: function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/ixp', {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                }
              ).catch(reject);
          });
        },
        peers: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/ixp/' + ixpid + '/peers', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        peer: function (rsid, productid) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/ixp/' + ixpid + '/' + rsid + '/product/' + productid, {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        prefixes: function (rsid, productid) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/ixp/' + ixpid + '/' + rsid + '/product/' + productid + '/prefixes', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        graph: function (productid, to, from) {
          var pObj = {
            productIdOrUid: productid
          };
          if (!to)
            pObj.to = new Date().getTime();
          if (!from)
            pObj.from = pObj.to - 86400000;

          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/graph/', pObj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        graphMbps: function (productid, from, to) {
          var pObj = {
            productIdOrUid: productid
          };
          pObj.to = to || new Date().getTime();
          pObj.from = from || pObj.to - 86400000;

          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/graph/mbps', pObj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        }
      };
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
                if (typeof errors == 'function')
                  errors(d);

              }
            );
        });
      });
    };

    this.ports = function (incResources) {
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/products', {
              incResources: (incResources ? 'true' : 'false')
            }, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data);
              }
            ).catch(reject);
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
              }
            ).catch(reject);
        });
      });
    };

    this.notifications = function (destination) {
      return {
        destinations: function () {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/messageDestinations', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        events: function () {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/messageEvents', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        update: function (obj) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.put(baseurl + '/messageDestination/' + destination, obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        }
      };
    };

    this.eway = function () {
      return {
        makePayment: function (amountInCents) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.post(baseurl + '/eway/tokenpayment?amountInCents=' + amountInCents, {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        checkAccessCode: function (code) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.post(baseurl + '/eway/paymenttoken?accessCode=' + code, {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        getAccessCodeRegister: function (redirectUrl) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/eway/accesscode/cardregistration', {
                  redirectUrl: redirectUrl
                }, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        getAccessCodeOnceOff: function (cents) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/eway/accesscode/onceoffpayment', {
                  ammountInCents: cents
                }, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        hasAccessCode: function () {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/eway/paymenttokenstatus', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        deleteAccessCode: function () {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.delete(baseurl + '/eway/paymenttokenstatus', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        }
      };
      //eway / accesscode
    };

    this.product = function (productId) {
      // /v2/dropdowns/locations

      return {
        azure: function (serviceUuid) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/secure/azure/' + serviceUuid, {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        oracle: function (serviceUuid) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/secure/oracle/' + serviceUuid, {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        integration: function (serviceUuid) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/secure/partner/' + serviceUuid, {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        checkPrice: function (rateLimit) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              innerThis.get().then(function (productObj) {
                var type = '/' + productObj.productType.toLowerCase();
                if (type == '/megaport')
                  type = '';
                xhr.get(baseurl + '/product' + type + '/' + productId + '/checkPrice', {
                    rateLimit: rateLimit
                  }, innerthis.credentials.token)
                  .then(
                    function (d) {
                      resolve(d.data || d);
                    }).catch(reject);
              }).catch(reject);
            });
          });
        },
        history: function (year, month, newSpeed) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              var sObj = {};
              if (newSpeed)
                sObj.newSpeed = newSpeed;
              xhr.get(baseurl + '/product/' + productId + '/rating/' + year + '/' + month, sObj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        //        types: function() {
        //          var innerThis = this;
        //          return new Promise(function(resolve, reject) {
        //            q.onready(function() {
        //              innerThis.then(function(productObj) {
        //                var type = '/' + productObj.productType.toLowerCase();
        //                if (type == '/megaport')
        //                  type = '';
        //                xhr.get(baseurl + '/product' + type + '/' + productId + '/types', {}, innerthis.credentials.token)
        //                  .then(
        //                    function(d) {
        //                      resolve(d.data || d);
        //                    }
        //                  ).catch(reject);
        //              });
        //            });
        //          });
        //        },
        graph: function () {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/graph/', {
                  productIdOrUid: productId
                }, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        graphMbps: function (from, to) {

          var pObj = {
            productIdOrUid: productId
          };
          pObj.to = to || new Date().getTime();
          pObj.from = from || pObj.to - 86400000;

          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/graph/mbps/', pObj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        logs: function () {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/product/' + productId + '/logs', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        getKey: function (key) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            var obj = {};

            if (key)
              obj.key = key;

            if (productId)
              obj.productIdOrUid = productId;

            q.onready(function () {
              xhr.get(baseurl + '/service/key', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    d.data = d.data || [];
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        createKey: function (obj) {
          obj.productUid = productId;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.jpost(baseurl + '/service/key', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }).catch(reject);
            });
          });
        },
        updateKey: function (obj) {
          obj.productUid = productId;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.put(baseurl + '/service/key', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }).catch(reject);
            });
          });
        },
        cancel: function (now, rating, description) {
          return new Promise(function (resolve, reject) {
            reject = reject || function () {};
            q.onready(function () {
              var obj = {};
              if (rating || description)
                obj = {
                  rating: rating || 3,
                  description: description || ''
                };
              xhr.jpost(baseurl + '/product/' + productId + '/action/' + (now ? 'CANCEL_NOW' : 'CANCEL'), obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }).catch(reject);
            });
          });
        },
        uncancel: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.jpost(baseurl + '/product/' + productId + '/action/UN_CANCEL', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }).catch(reject);
            });
          });
        },
        cancelCharges: function (now) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/product/' + productId + '/action/' + (now ? 'CANCEL_NOW' : 'CANCEL') + '/charges', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }).catch(reject);
            });
          });
        },
        update: function (obj) {
          var innerThis = this;
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              innerThis.get().then(function (productObj) {
                var type = '/' + productObj.productType.toLowerCase();
                if (type == '/megaport')
                  type = '';
                xhr.put(baseurl + '/product' + type + '/' + productId, obj, innerthis.credentials.token)
                  .then(
                    function (d) {
                      resolve(d.data || d);
                    }).catch(reject);
              });
            });
          });
        },
        get: function (incResources) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/product/' + productId, {
                  incResources: (incResources ? 'true' : 'false')
                }, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }).catch(reject);
            });
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

      if (name == 'circuits')
        url = '/locations/circuits';

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
              }).catch(reject);
        });
      });
    };


    this.markets = function (marketId) {

      return {
        update: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.put(baseurl + '/market/' + marketId, obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d);
                  }).catch(reject);
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
                  }).catch(reject);
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
                }).catch(reject);
          });
        } : function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/market', {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                }).catch(reject);
          });
        })
      };
    };


    this.marketplace = function () {
      return {
        get: function (includeServices) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/marketplace/profiles', {
                includeServices: (includeServices ? 'true' : 'false')
              }, innerthis.credentials.token);
            }).then(function (d) {
              resolve(d.data || d);
            }, reject);
          });
        },
        updateProfile: function (marketPlaceObj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.put(baseurl + '/marketplace/profile', marketPlaceObj, innerthis.credentials.token)
                .then(function (d) {
                  resolve(d.data || d);
                }, reject);
            }).then(function (d) {
              resolve(d.data || d);
            }, reject);
          });
        },
        updateServices: function (servicesObj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.put(baseurl + '/marketplace/services', servicesObj, innerthis.credentials.token)
                .then(function (d) {
                  resolve(d.data || d);
                }, reject);
            }).then(function (d) {
              resolve(d.data || d);
            }, reject);
          });
        },
        services: function (companyUid) {
          var url = '/marketplace/services' + (companyUid ? '/' + companyUid : '');
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + url, {}, innerthis.credentials.token);
            }).then(function (d) {
              resolve(d.data || d);
            }, reject);
          });
        },
        profile: function (companyUid) {
          var url = '/marketplace/profile' + (companyUid ? '/' + companyUid : '');
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + url, {}, innerthis.credentials.token);
            }).then(function (d) {
              resolve(d.data || d);
            }, reject);
          });
        }
      };
    };

    this.company = function (companyUid) {
      companyUid = companyUid || innerthis.credentials.companyUid;
      return {
        upgrade: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.jpost(baseurl + '/social/company', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
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
            xhr.get(baseurl + '/company/' + companyUid, {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  if (typeof reject == 'function')
                    reject(d);
                  if (typeof errors == 'function')
                    errors(d);
                }
              );
          });
        },
        metadata: function () {
          return {
            then: function (resolve, reject) {
              q.onready(function () {
                xhr.get(baseurl + '/company/' + companyUid + '/metadata', {}, innerthis.credentials.token)
                  .then(
                    function (d) {
                      resolve(d.data || d);
                    },
                    function (d) {
                      if (typeof reject == 'function')
                        reject(d);
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  );
              });
            },
            update: function (obj) {
              return new Promise(function (resolve, reject) {
                q.onready(function () {
                  xhr.put(baseurl + '/company/' + companyUid + '/metadata', obj, innerthis.credentials.token)
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
          };
        }

      };
    };

    this.simplePay = function () {
      return {
        getCheckout: function (supplierId) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/simplepay/checkout', {
                  supplierId: supplierId
                }, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        registrations: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/simplepay/registration', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        register: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.jpost(baseurl + '/simplepay/registration', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        }
      };
    };

    this.employment = function (employmentId) {
      return {
        employ: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.jpost(baseurl + '/employment', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        delete: {}, // needs to be written
        get: function () {
          return new Promise(function (resolve, reject) {
            var url = baseurl + '/employment';
            if (employmentId)
              url = baseurl + '/employment/' + employmentId;

            xhr.get(url, {}, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                }).catch(reject);
          });
        }
      };
    };

    this.profile = function (obj) {
      return {
        mfaQr: function () {
          // /v2/mfa/qr?
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/mfa/qr', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        update: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.put(baseurl + '/employee/' + innerthis.credentials.personId, obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        changeEmail: function (obj) {
          // password, newEmail
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.post(baseurl + '/email/change', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        verifyEmail: function (token) {
          return new Promise(function (resolve, reject) {
            xhr.post(baseurl + '/email/verify', {
                verifyToken: token
              })
              .then(
                function (d) {
                  resolve(d.data || d);
                }
              ).catch(reject);
          });
        },
        changePassword: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.post(baseurl + '/password/change', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        activity: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/activity', {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        get: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/employee/' + innerthis.credentials.personId, {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        }
      };
    };

    this.employee = function (id) {
      return {
        update: function (obj) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.put(baseurl + '/employee/' + id, obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        },
        get: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/employee/' + id, {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  }
                ).catch(reject);
            });
          });
        }
      };
    };

    /* jshint ignore:start */
    function hash(str) {
      if (typeof str != 'string')
        str = JSON.stringify(str);
      if (Array.prototype.reduce) {
        return str.split('').reduce(function (a, b) {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
      }
      var hsh = 0;
      if (str.length === 0) return hsh;
      for (var i = 0; i < str.length; i++) {
        var character = str.charCodeAt(i);
        hsh = ((hsh << 5) - hsh) + character;
        hsh = hsh & hsh; // Convert to 32bit integer
      }
      return hsh;
    }
    /* jshint ignore:end */

    function clone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }

    var priceBookCache = {};
    this.priceBook = function () {
      return {
        resetCache: function () {
          priceBookCache = {};
        },
        megaport: function (obj) {
          return new Promise(function (resolve, reject) {
            if (priceBookCache[hash(obj)])
              return resolve(clone(priceBookCache[hash(obj)]));
            q.onready(function () {
              xhr.get(baseurl + '/pricebook/megaport', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    priceBookCache[hash(obj)] = d.data || d;
                    resolve(clone(d.data) || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        vxc: function (obj) {

          return new Promise(function (resolve, reject) {
            if (priceBookCache[hash(obj)])
              return resolve(clone(priceBookCache[hash(obj)]));
            q.onready(function () {
              xhr.get(baseurl + '/pricebook/vxc', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    priceBookCache[hash(obj)] = d.data || d;
                    resolve(clone(d.data) || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        ix: function (obj) {
          return new Promise(function (resolve, reject) {
            if (priceBookCache[hash(obj)])
              return resolve(clone(priceBookCache[hash(obj)]));
            q.onready(function () {
              xhr.get(baseurl + '/pricebook/ix', obj, innerthis.credentials.token)
                .then(
                  function (d) {
                    priceBookCache[hash(obj)] = d.data || d;
                    resolve(clone(d.data) || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        }
      };
    };

    this.invoices = function (marketId, companyId) {
      companyId = companyId || this.credentials.companyId;
      return {
        invoice: function (invoiceId) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.get(baseurl + '/invoice/' + invoiceId, {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
            });
          });
        },
        pdf: function (invoiceId) {
          return {
            then: function (func) {
              func(baseurl + '/invoice/' + invoiceId + '/pdf?token=' + innerthis.credentials.token);
            }
          };
        },
        then: function (resolve, reject) {
          q.onready(function () {
            xhr.get(baseurl + '/invoice', {
                companyId: companyId
              }, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  reject(d);
                  if (typeof errors == 'function')
                    errors(d);
                }
              );
          });
        }
      };
    };

    this.promoCode = function (code) {
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.get(baseurl + '/promocode', {
              promoCode: code
            }, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data || d);
              },
              function (d) {
                reject(d);
                if (typeof errors == 'function')
                  errors(d);

              }
            );
        });
      });
    };

    this.approveVxc = function (orderUid, sendObj) {
      return new Promise(function (resolve, reject) {
        q.onready(function () {
          xhr.put(baseurl + '/order/vxc/' + orderUid, sendObj, innerthis.credentials.token)
            .then(
              function (d) {
                resolve(d.data || d);
              },
              function (d) {
                reject(d);
              }
            );
        });
      });
    };

    this.serviceOrder = function (serviceOrderUid, companyUid) {
      return {
        save: function (title, obj) {
          var sendObj = {
            companyUid: companyUid || innerthis.credentials.companyUid
          };
          if (typeof title == 'string') {
            sendObj.title = title;
            sendObj.serviceRequestObject = obj;
          } else {
            sendObj.serviceRequestObject = title;
            if (!serviceOrderUid) {
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
        delete: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.delete(baseurl + '/serviceorder/' + serviceOrderUid, {}, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    reject(d);
                  }
                );
            });
          });
        },
        validate: function () {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.post(baseurl + '/serviceorder/validate', {
                  serviceOrderId: serviceOrderUid,
                }, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    reject(d);
                  }
                );
            });
          });
        },
        deploy: function (promoCodes) {
          return new Promise(function (resolve, reject) {
            q.onready(function () {
              xhr.post(baseurl + '/serviceorder/process', {
                  serviceOrderId: serviceOrderUid,
                  serviceOrderStatus: 'ACCEPTED',
                  promoCodes: JSON.stringify(promoCodes)
                }, innerthis.credentials.token)
                .then(
                  function (d) {
                    resolve(d.data || d);
                  },
                  function (d) {
                    if (typeof reject == 'function') {
                      reject(d);
                    } else {
                      if (typeof errors == 'function')
                        errors(d);
                    }
                  }
                );
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
              url = '/serviceorder';
              obj = {
                companyUid: companyUid || innerthis.credentials.companyUid
              };
            }
            xhr.get(baseurl + url, obj, innerthis.credentials.token)
              .then(
                function (d) {
                  resolve(d.data || d);
                },
                function (d) {
                  reject(d);
                  if (typeof errors == 'function')
                    errors(d);
                }
              );
          });
        }
      };
    };


    this.register = function (obj) {
      return new Promise(function (resolve, reject) {
        xhr.post(baseurl + '/social/registration', obj)
          .then(
            function (d) {
              resolve(d.data || d);
            })
          .catch(reject);
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

  var pendingXhr = [];
  var xhreq = function () {
    var innerthis = this;

    this.ajax = function (method, url, params, token, syncro) {
      syncro = syncro || true;
      return new Promise(function (resolve, reject) {
        method = method.toUpperCase();

        if (method == 'GET') {
          if (typeof params == 'object') {
            var querystr = (function (obj) {
              var str = [];
              for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                  if (!obj[p])
                    str.push(encodeURIComponent(p) + '=');
                  else
                    str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
                }
              }
              return str.join('&');
            })(params);
            url += ((url.indexOf('?') > -1) ? '&' : '?') + querystr;
          }
          url = url.replace(/&$/, '');
        }

        var rq = new XMLHttpRequest();

        pendingXhr.push('a');

        rq.open(method.replace('J', ''), url, syncro);

        if (typeof token == 'string')
          rq.setRequestHeader('X-Auth-Token', token);

        rq.onload = function () {
          pendingXhr.shift();
          rq.status = parseInt(rq.status) || 400;
          if (rq.status == 503)
            return maintenance();

          if (rq.status < 210) {
            resolve(JSON.parse(rq.responseText));
          }
          if (rq.status > 210) {
            reject({
              status: rq.status,
              data: JSON.parse(rq.responseText)
            });
          }
          if (rq.status == 400) {
            console.warn(400);
          }
          if (rq.status == 401) {
            failauth(rq);
          }
        };
        rq.onerror = function () {
          pendingXhr.shift();
          return hardfail();
        };

        switch (method) {

        case 'POST':
          rq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
          if (typeof params == 'object') {
            params = (function (obj) {
              var str = [];
              for (var p in obj)
                if (obj.hasOwnProperty(p))
                  str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));

              return str.join('&');
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

      });
    };

    this.get = function (url, params, token, syncro) {
      return innerthis.ajax('GET', url, params, token, syncro);
    };
    this.post = function (url, params, token, syncro) {
      return innerthis.ajax('POST', url, params, token, syncro);
    };
    this.jpost = function (url, params, token, syncro) {
      return innerthis.ajax('JPOST', url, params, token, syncro);
    };
    this.put = function (url, params, token, syncro) {
      return innerthis.ajax('PUT', url, params, token, syncro);
    };
    this.delete = function (url, params, token, syncro) {
      return innerthis.ajax('DELETE', url, params, token, syncro);
    };
  };

  return exports;
})();
window.MP = mp;
if (typeof module == 'object')
  module.exports = mp;
