//script.js
require('electron-cookies');

var _ipc    = window.require('electron').ipcRenderer;
var openbmc = angular.module('openbmc', ['ngRoute', 'ngResource', 'ngCookies', 'ngSanitize']);

var win = require('remote').getCurrentWindow();

// configure routes
openbmc.config(function($routeProvider, $httpProvider) {
  $routeProvider

  // route for the home page
  .when('/', {
    templateUrl: 'pages/login.html',
    controller: 'mainController'
  })

  // route for the login page
  .when('/login', {
    templateUrl: 'pages/login.html',
    controller: 'mainController'
  })

  // route for the app
  .when('/app', {
    templateUrl: 'pages/app.html',
    controller: 'appController'
  });

  $httpProvider.defaults.withCredentials = true;
});

openbmc.controller('mainController', function($rootScope, $scope, $http, $cookies, $location) {
  _ipc.send('resize', 396, 445);

  $scope.loginError = false;
  $scope.regex = '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$';

  $scope.login = function() {
    var ip = $scope.ipAddress;

    console.log("SUBMITTED");
    console.log($scope.ipAddress);
    console.log($scope.port);

    if($scope.port) {
      console.log("FOUND PORT", $scope.port);
      ip = ip + ':' + $scope.port;
      console.log(ip);
    }

    var startTime = new Date().getTime();

    $http({
      url: 'http://' + ip + '/list',
      method: 'GET',
      timeout: 5000,
      headers: {
        'Content-Type' : 'application/json'
      }
    }).success(function(response) {
      if(typeof response != 'object') {
        console.log("AUTH ERROR");
        $scope.loginError = true;
        $scope.errorMessage = 'Cannot bypass firewall on <b>' + $scope.ipAddress + '</b>';
        return;
      }

      console.log(response);

      $rootScope.ip = ip;
      $rootScope.user = $scope.username;

      $scope.error = false;
      $location.path('/app');
    }).error(function(result, status, header, config) {
      console.log(error);
      console.log(result);
      console.log(status);
      console.log(header);
      console.log(config);

      if(typeof response != 'object') {
        console.log("AUTH ERROR");
        $scope.loginError = true;
        $scope.errorMessage = 'Connection to <b>' + $scope.ipAddress + '</b> was refused.';
        return;
      }

      var respTime = new Date().getTime() - startTime;

      if(respTime >= config.timeout) {
          $scope.loginError = true;
          $scope.errorMessage = "Could not connect to " + ip;
          console.error('Could not connect to ' + ip);
        } else {
          $scope.loginError = true;
          $scope.errorMessage = "An unknown error occurred.";
          console.error('An unknown error occurred. See details:');
          console.log(result, status, header, config);
        }
    });

    // $http({
    //   url: 'http://' + ip + '/login',
    //   method: 'POST',
    //   data: JSON.stringify({"data": [$scope.username, $scope.password]}),
    //   withCredentials: true,
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   timeout: 5000,
    // }).success(function(response) {
    //
    //   if(typeof response != 'object') {
    //     console.log("AUTH ERROR");
    //     $scope.loginError = true;
    //     $scope.errorMessage = 'Cannot bypass firewall on <b>' + $scope.ipAddress + '</b>';
    //     return;
    //   }
    //
    //   console.log(response);
    //   console.log(response.data);
    //
    //   if(response.data === 'Invalid username or password') {
    //     // Error: Credentials Incorrect
    //     $scope.loginError = true;
    //     $scope.errorMessage = "Username or password was incorrect";
    //     console.error('Username or password was incorrect');
    //   } else {
    //     console.log('Logged in as ' + $scope.username);
    //     // Success!
    //     $scope.error = false;
    //     $rootScope.ip = $scope.ipAddress;
    //     $rootScope.user = $scope.username;
    //     $location.path('/app');
    //   }
    //   // I need to set the cookie here!
    // }).error(function(result, status, header, config) {
    //   var respTime = new Date().getTime() - startTime;
    //   if(respTime >= config.timeout) {
    //     $scope.loginError = true;
    //     $scope.errorMessage = "Could not connect to " + ip;
    //     console.error('Could not connect to ' + ip);
    //   } else {
    //     $scope.loginError = true;
    //     $scope.errorMessage = "An unknown error occurred.";
    //     console.error('An unknown error occurred. See details:');
    //     console.log(result, status, header, config);
    //   }
    // });
  }
});

openbmc.controller('appController', function($rootScope, $scope, $http, $location) {
  _ipc.send('resize', 1008, 617);
  _ipc.send('toggleResizable', true);

  // console.log($rootScope.user);
  // console.log($rootScope.ip);
  console.log('1');

  $scope.update = function(currentPath) {
    console.log("UPDATE SCOPE");
    $http({
      url: 'http://' + $rootScope.ip + '/list',
      method: 'GET',
      headers: {
        'Content-Type' : 'application/json'
      }
    }).success(function(response) {
      console.log(currentPath);
      console.log(response);

      if($scope.currentPath) {
        if($scope.currentPath != response) {

        }
      }
      var p = parsePathArray(response.data);
      // $scope.paths = parsePathArray(response.data);

      if(currentPath === '/') {
        $scope.paths = parsePathArray(response.data);
        $scope.navigate(currentPath);
      } else if($scope.currentPath && $scope.currentPath != currentPath) {
        $scope.paths = parsePathArray(response.data);
        $scope.navigate(currentPath);
      } else if(response.data.indexOf(currentPath) > -1) {
        console.log("The PATH EXISTS!!!!!!!!!!!!!!!!!!!!!!!");
        // The path exists!
        // Check $scope.paths for new set of paths...
        console.log("PATHS UPDATED?");
        if($scope.paths && $scope.paths != p) {
          // $scope.navigate(current)
          // Paths Updated!!!!
          console.log(true);
          $scope.paths = parsePathArray(response.data);
          $scope.options = getChildren($scope.currentPath);
        } else {
          console.log(false);
          // Do nothing
        }
      } else {
        // The path no longer exists... back one.
        // $scope.paths = parsePathArray(response.data);
        $scope.paths = parsePathArray(response.data);
        currentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
        console.log('The path no longer exists... back one.')
        console.log("CurrentPath!!!!!!!!", currentPath);
        $scope.navigate(currentPath);
      }
    }).error(function(error) {
      console.log(error);
    });
  }

  $scope.update('/');

  $scope.navigate = function(path) {
    $scope.currentPath = path;
    $scope.prettyPath = $scope.currentPath.split('/').join(' / ');
    $scope.options = getChildren($scope.currentPath);
    $scope.breadcrumb = getBreadcrumbs($scope.currentPath);
    $scope.methods = [];
    getSchema($rootScope.ip, path);
  }

  $scope.back = function() {
    console.log("BACK!!!");
    console.log($scope.currentPath);
    var previous = $scope.currentPath.split('/');
    previous.pop();
    previous = previous.join('/');
    console.log(previous);
    $scope.update(previous);
    // $scope.navigate(previous);
  }

  $scope.openGithub = function() {
    require("shell").openExternal("http://www.github.com/openbmc");
  }

  $scope.signout = function() {
    $location.path('/login');
    _ipc.send('toggleResizable', false);
  }

  $scope.toggleMethod = function(method) {
    if(method.collapsed === false) {
      method.collapsed = true;
    } else {
      method.collapsed = false;
    }
  }

  $scope.runMethod = function(method) {
    console.log("RUNINNG METHOD");
    console.log(method.parameters);
    if(method.parameters.length > 0) {
      var data = [];
      for (var i = 0; i < method.parameters.length; i++) {
        data.push(method.parameters[i].value);
      }
      $http({
        url: 'http://' + $rootScope.ip + $scope.currentPath + '/action/' + method.name,
        method: 'POST',
        data: JSON.stringify({"data": data}),
        headers: {'Content-Type': 'application/json'}
      }).success(function(response) {
        console.log("METHOD SUCCESS! @@@@@@@");
        method.showResponse = true;
        method.response = JSON.stringify(response, null, 4);
        $http({
          url: 'http://' + $rootScope.ip + '/list',
          method: 'GET',
          headers: {
            'Content-Type' : 'application/json'
          }
        }).success(function(response) {

          if($scope.paths != response.data) {
            console.log("SCOPE PATHS ARE THE SAME");
            $scope.paths = parsePathArray(response.data);
            $scope.options = getChildren($scope.currentPath);
          } else {
            console.log("SCOPE PATHS NOT THE SAME");
            console.log(response.data, $scope.paths);
          }
        }).error(function(e) {
          console.log(e);
        });
      }).error(function(response) {
        console.log("METHOD ERROR! @@@@@@@");
        method.showResponse = true;
        method.response = JSON.stringify(response, null, 4);
        $http({
          url: 'http://' + $rootScope.ip + '/list',
          method: 'GET',
          headers: {
            'Content-Type' : 'application/json'
          }
        }).success(function(response) {
          if($scope.paths != response.data) {
            console.log("SCOPE PATHS ARE THE SAME");
            $scope.paths = parsePathArray(response.data);
            $scope.options = getChildren($scope.currentPath);
          } else {
            console.log("SCOPE PATHS NOT THE SAME");
            console.log(response.data, $scope.paths);
          }
        }).error(function(e) {
          console.log(e);
        });
      });
    } else {
      $http({
        url: 'http://' + $rootScope.ip + $scope.currentPath + '/action/' + method.name,
        method: 'POST',
        data: {"data": []},
        headers: {'Content-Type': 'application/json'}
      }).success(function(response) {
        $http({
          url: 'http://' + $rootScope.ip + '/list',
          method: 'GET',
          headers: {
            'Content-Type' : 'application/json'
          }
        }).success(function(response) {
          if($scope.paths != response.data) {
            console.log("SCOPE PATHS ARE THE SAME");
            $scope.paths = parsePathArray(response.data);
            $scope.options = getChildren($scope.currentPath);
          } else {
            console.log("SCOPE PATHS NOT THE SAME");
            console.log(response.data, $scope.paths);
          }
        }).error(function(e) {
          console.log(e);
        });
        method.showResponse = true;
        method.response = JSON.stringify(response, null, 4);
      }).error(function(response) {
        $http({
          url: 'http://' + $rootScope.ip + '/list',
          method: 'GET',
          headers: {
            'Content-Type' : 'application/json'
          }
        }).success(function(response) {
          if($scope.paths != response.data) {
            console.log("SCOPE PATHS ARE THE SAME");
            $scope.paths = parsePathArray(response.data);
            $scope.options = getChildren($scope.currentPath);
          } else {
            console.log("SCOPE PATHS NOT THE SAME");
            console.log(response.data, $scope.paths);
          }
        }).error(function(e) {
          console.log(e);
        });
        method.showResponse = true;
        method.response = JSON.stringify(response, null, 4);
      });
    }

    // $scope.update($scope.currentPath);
    // console.log("TEST THE METHOD!");
    // console.log("=====================");
    // // THIS WORKS!!!!
    // $http({
    //   url: 'http://9.41.164.53:20080/org/openbmc/examples/path0/SDBusObj/action/Echo',
    //   method: 'POST',
    //   data: JSON.stringify({"data": ["hello"]}),
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    // }).success(function(response) {
    //   console.log(response);
    // }).error(function(error) {
    //   console.log(response);
    // });
  }

  $scope.getDataType = function(type) {
    if(type === 'y') { return 'byte'; }
    else if(type === 'b') { return 'boolean' }
    else if(type === 'n') { return 'int16' }
    else if(type === 'q') { return 'uint16' }
    else if(type === 'i') { return 'int32' }
    else if(type === 'u') { return 'uint32' }
    else if(type === 'x') { return 'int64' }
    else if(type === 't') { return 'uint64' }
    else if(type === 'd') { return 'double' }
    else if(type === 'h') { return 'unix fd' }
    else if(type === 's') { return 'string' }
    else if(type === 'o') { return 'object path' }
    else if(type === 'g') { return 'signature' }
    else if(type === 'a') { return 'array' }
    else if(type.indexOf('(') != -1) { return 'struct'}
    else if(type.indexOf('a') != -1) { return 'array' }
    else { return 'undefined'}
  }

  function parsePathArray(paths) {
    var parsed = {};
    for(var i = 0; i < paths.length; i++) {
      var position = parsed;
      var split = paths[i].split('/');
      for(var j = 0; j < split.length; j++) {
        if(split[j] !== "") {
          if(typeof position[split[j]] === 'undefined') {
            position[split[j]] = {};
          }

          position = position[split[j]];
        }
      }
    }

    return parsed;
  }

  function getChildren(path) {
    var split = path.split('/');
    var position = $scope.paths;

    for (var i = 0; i < split.length; i++) {
      if(split[i] != "") {
        position = position[split[i]];
      }
    }

    var options = [];

    for (var key in position) {
      if(path === '/') {
        options.push({
          name: key,
          path: path + key,
          active: false
        });
      } else {
        options.push({
          name: key,
          path: path + '/' + key,
          active: false
        });
      }
    }
    // if(options.isEmpty()) {
    //   console.log("OPTIONS EMPTY");
    // }

    // getSchema($rootScope.ip, '20080', path);

    // options = $scope.options;
    // for(var j = 0; j < options.length; j++) {
    //   options[j]['active'] = false;
    //
    //   if(options[j].path === path) {
    //     options[j]['active'] = true;
    //   }
    // }

    // if(options.length === 0) {
    //   // Get Schema
    //   console.log("====================");
    //   console.log("SHOW SCHEMA!");
    //   console.log("====================");
    //
    //   getSchema($rootScope.ip, path);
    //
    //   options = $scope.options;
    //   for(var j = 0; j < options.length; j++) {
    //     options[j]['active'] = false;
    //
    //     if(options[j].path === path) {
    //       options[j]['active'] = true;
    //     }
    //   }
    // }

    return options;
    //console.log(position);
  }

  function getSchema(ip, path) {
    var query = 'http://' + ip + path + '/schema';
    console.log('Running schema on... ' + query);
    $http({
      url: query,
      method: 'GET',
      headers: {
        'Content-Type' : 'application/json'
      }
    }).success(function(response) {
      console.log("THIS IS WHAT YOU WANT:::");
      console.log(response.data);
      var methods = [];
      for (var key in response.data) {
        // Focus on methods, disregard signals for now
        // each object under method names is a parameter, so create an input
        // 'name' is the name of the parameter
        // before worrying about functions, present a list of methods
        if(key.indexOf('openbmc') > -1) {
          console.log(key);
          console.log(response.data[key].method);
          // Inside the method object are multiple arrays.
          // The keys of the arrays are the name of the method (from the selected openbmc interface).
          // The array itself is a list of objects that are the parameters for the method.
          // --- An input is created for each parameter.
          // Each parameter object contains three properties: direction, name, and type.
          // --- Direction (in / out) indicates the type of output from the server.
          // --- The name, is the name of the paramter.
          // --- The type is the datatype for the paramter.
          //     (Reference: https://dbus.freedesktop.org/doc/dbus-specification.html#type-system )
          for(var method in response.data[key].method) {
            // This is looping over each method
            console.log("THE METHOD:", method);
            // curl command:
            // curl -c cjar -b cjar -k -H "Content-Type: application/json" -X POST -d "{\"data\": [<positional-parameters>]}" https://bmc/org/openbmc/control/fan0/action/setspeed
            var m = {
              'name' : method,
              'hideParams': true,
              'parameters' : [],
              'response' : '',
              'showResponse': false
            };

            var curlParams = '';

            for(var i = 0; i < response.data[key].method[method].length; i++) {
              // This logs each parameter object
              console.log(response.data[key].method[method][i]);

              var paramObject = {};

              if(response.data[key].method[method][i].direction == 'in') {
                // ADD IT TO THE ARRAY OF PARAMS
                paramObject['type'] = $scope.getDataType(response.data[key].method[method][i].type);
                paramObject['index'] = response.data[key].method[method][i];
                paramObject['value'] = '';
                m.parameters.push(paramObject);
              }

              // Button click to run "THE METHOD"
              // Pass the METHOD as a param
              // $scope.method[method.name].parameters[p.index].value;



              // This is looping through all the properties of the current parameter **********
              // for (type in response.data[key].method[method][i]) {
              //   paramObject[type] = response.data[key].method[method][i][type];
              //
              //   if(type === 'name') {
              //     curlParams += response.data[key].method[method][i][type] + ',';
              //   } else {
              //     curlParams += response.data[key].method[method][i]
              //   }
              // }




              // var
              //
              // for(type in response.data[key].method[method][i]) {
              //
              // }
              // This is looping over each parameter
              // var p = {};
              // p['name'] = response.data[key].method[method][i].name;
              // p['direction'] = response.data[key].method[method][i].direction;
              // p['type'] = response.data[key].method[method][i].type;

              // m.parameters.push(p);

              // curlParams += response.data[key].method[method][i].name + ', ';
            }
            console.log(curlParams)
            curlParams = curlParams.slice(0, -1);
            console.log(curlParams);
            if(m.parameters.length == 0) {
              // m['curl'] = 'curl -H "Content-Type: application/json" -X POST http://' + $rootScope.ip + $scope.currentPath + '/action/' + m.name;
              m['hideParams'] = true;
            } else {
              // Method contains paramters
              // How to bind?
              // m['curl'] = 'curl -H "Content-Type: application/json" -X POST -d "{\\"data\\": [' + curlParams + ']}" http://' + $rootScope.ip + $scope.currentPath + '/action/' + m.name;
              // m['type'] = 'POST';
              m['hideParams'] = false;
            }

            m['collapsed'] = true;

            methods.push(m);
            console.log(methods);
          }
        }
      }
      console.log("LOGGING METHODS!");
      // methods[0].collapsed = false;
      $scope.methods = methods;
    }).error(function(error) {
      console.log(error);
    });
  }

  function getBreadcrumbs(str) {
    var p = str.split('/');
    p.splice(0, 1);

    return p;
  }
});
