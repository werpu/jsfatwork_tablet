/* Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to you under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * Runtime/Startup class
 * this is the central class which initializes all base mechanisms
 * used by the rest of the system such as
 * a) namespacing system
 * b) browser detection
 * c) loose configuration coupling
 * d) utils methods to fetch the implementation
 * e) ajaxed script loading
 * f) global eval (because it is used internally)
 * g) Structural base patterns as singleton, delegate and inheritance
 *
 * Note this class is self contained and must!!! be loaded
 * as absolute first class before going into anything else
 *
 *
 */
/** @namespace myfaces._impl.core._Runtime*/

(!window.myfaces) ? window.myfaces = {} : null;
(!myfaces._impl) ? myfaces._impl = {} : null;
(!myfaces._impl.core) ? myfaces._impl.core = {} : null;
//now this is the only time we have to do this cascaded and manually
//for the rest of the classes our reserveNamespace function will do the trick
//Note, this class uses the classical closure approach (to save code)
//it cannot be inherited by our inheritance mechanism, but must be delegated
//if you want to derive from it
//closures and prototype inheritance do not mix, closures and delegation however do
if (!myfaces._impl.core._Runtime) {
    myfaces._impl.core._Runtime = new function() {
        //the rest of the namespaces can be handled by our namespace feature
        //helper to avoid unneeded hitches
        var _T = this;

        //namespace idx to speed things up by hitting eval way less
        _T._reservedNMS = {};

        /**
         * replacement counter for plugin classes
         */
        _T._classReplacementCnt = 0;

        /**
         * global eval on scripts
         *
         * usage return _T.globalEval('myvar.myvar2;');
         *
         *
         * Note some libraries like jquery use html head attachments
         * to run the global eval, at least for loaded scripts
         * this methid was flaky and failed on chrome under certain conditions,
         * since our method works reliably in modern browsers currently in use
         * we do it via eval, we still can switch to the head method
         * if there are arguments why that one works better than ours
         */
        _T.globalEval = function(code) {
            //TODO add a config param which allows to evaluate global scripts even if the call
            //is embedded in an iframe
            if (window.execScript) {
                //execScript definitely only for IE otherwise we might have a custom
                //window extension with undefined behavior on our necks
                //window.execScript does not return anything
                //on htmlunit it return "null object"
                var ret = window.execScript(code);
                if ('undefined' != typeof ret && ret == "null" /*htmlunit bug*/) {
                    return null;
                }
                return ret;
            } else if (window.eval) {

                //fix which works in a cross browser way
                //we used to scope an anonymous function
                //but I think this is better
                //the reason is firefox applies a wrong scope
                //if we call eval by not scoping

                if (!_T.browser.isBlackBerry || _T.browser.isBlackBerry >= 6) {
                    var gEval = function () {

                        var ret = window.eval.call(window, code);
                        if ('undefined' == typeof ret) return null;
                        return ret;
                    };
                    var ret = gEval();
                    if ('undefined' == typeof ret) return null;
                    return ret;
                } else {
                    //blackberry 5- only understands the flaky head method
                    //which fails on literally all newer browsers one way or the other
                    return _T._globalEvalHeadAppendixMethod(code);
                }
                //we scope the call in window


            }
            //we probably have covered all browsers, but this is a safety net which might be triggered
            //by some foreign browser which is not covered by the above cases
            eval.call(window, code);
            return null;
        };

        /**
         * flakey head appendix method which does not work in the correct
         * order or at all for all modern browsers
         * but seems to be the only method which works on blackberry correctly
         * hence we are going to use it as fallback
         *
         * @param code the code part to be evaled
         */
        _T._globalEvalHeadAppendixMethod = function(code) {
            var location = document.getElementsByTagName("head")[0] || document.documentElement;
            var placeHolder = document.createElement("script");
            placeHolder.type = "text/javascript";
            placeHolder.text = code;
            location.insertBefore(placeHolder, location.firstChild);
            location.removeChild(placeHolder);
            return null;
        };


        /**
         * applies an object to a namespace
         * basically does what bla.my.name.space = obj does
         * note we cannot use var myNameSpace = fetchNamespace("my.name.space")
         * myNameSpace = obj because the result of fetch is already the object
         * which the namespace points to, hence this function
         *
         * @param nms the namespace to be assigned to
         * @param obj the  object to be assigned
         */
        _T.applyToGlobalNamespace = function(nms, obj) {
            var splitted = nms.split(/\./);
            if (splitted.length == 1) {
                window[nms] = obj;
                return;
            }
            var parent = splitted.slice(0, splitted.length - 1);
            var child = splitted[splitted.length - 1];
            var parentNamespace = _T.fetchNamespace(parent.join("."));
            parentNamespace[child] = obj;
        };

        /**
         * fetches the object the namespace points to
         * @param nms the namespace which has to be fetched
         * @return the object the namespace points to or null if nothing is found
         */
        _T.fetchNamespace = function(nms) {
            if ('undefined' == typeof nms || null == nms || !_T._reservedNMS[nms]) {
                return null;
            }

            var ret = null;
            try {
                //blackberries have problems as well in older non webkit versions
                if (!_T.browser.isIE) {
                    //in ie 6 and 7 we get an error entry despite the suppression
                    ret = _T.globalEval("window." + nms);
                }
                //namespace could point to numeric or boolean hence full
                //save check

            } catch (e) {/*wanted*/
            }
            //ie fallback for some ie versions path because it cannot eval namespaces
            //ie in any version does not like that particularily
            //we do it the hard way now
            if ('undefined' != typeof ret && null != ret) {
                return ret;
            }
            nms = nms.split(/\./);
            ret = window;
            var len = nms.length;

            for (var cnt = 0; cnt < len; cnt++) {
                ret = ret[nms[cnt]];
                if ('undefined' == typeof ret || null == ret) {
                    return null;
                }
            }
            return ret;

        };

        /**
         * Backported from dojo
         * a failsafe string determination method
         * (since in javascript String != "" typeof alone fails!)
         * @param it {|Object|} the object to be checked for being a string
         * @return true in case of being a string false otherwise
         */
        _T.isString = function(/*anything*/ it) {
            //	summary:
            //		Return true if it is a String
            return !!arguments.length && it != null && (typeof it == "string" || it instanceof String); // Boolean
        };

        /**
         * reserves a namespace in the specific scope
         *
         * usage:
         * if(_T.reserve("org.apache.myfaces.MyUtils")) {
         *      org.apache.myfaces.MyUtils = function() {
         *      }
         * }
         *
         * reserves a namespace and if the namespace is new the function itself is reserved
         *
         *
         *
         * or:
         * _T.reserve("org.apache.myfaces.MyUtils", function() { .. });
         *
         * reserves a namespace and if not already registered directly applies the function the namespace
         *
         * note for now the reserved namespaces reside as global maps justl like jsf.js but
         * we also use a speedup index which is kept internally to reduce the number of evals or loops to walk through those
         * namespaces (eval is a heavy operation and loops even only for namespace resolution introduce (O)2 runtime
         * complexity while a simple map lookup is (O)log n with additional speedup from the engine.
         *
         *
         * @param {|String|} nms
         * @returns true if it was not provided
         * false otherwise for further action
         */
        _T.reserveNamespace = function(nms, obj) {

            if (!_T.isString(nms)) {
                throw Error("Namespace must be a string with . as delimiter");
            }
            if (_T._reservedNMS[nms] || null != _T.fetchNamespace(nms)) {
                return false;
            }

            var entries = nms.split(/\./);
            var currNms = window;

            var tmpNmsName = [];

            for (var cnt = 0; cnt < entries.length; cnt++) {
                var subNamespace = entries[cnt];
                tmpNmsName.push(subNamespace);
                if ('undefined' == typeof currNms[subNamespace]) {
                    currNms[subNamespace] = {};
                }
                if (cnt == entries.length - 1 && 'undefined' != typeof obj) {
                    currNms[subNamespace] = obj;
                } else {
                    currNms = currNms[subNamespace];
                }
                _T._reservedNMS[tmpNmsName.join(".")] = true;
            }
            return true;
        };

        /**
         * check if an element exists in the root
         * also allows to check for subelements
         * usage
         * _T.exists(rootElem,"my.name.space")
         * @param {Object} root the root element
         * @param {String} subNms the namespace
         */
        _T.exists = function(root, subNms) {
            if (!root) {
                return false;
            }
            //special case locally reserved namespace
            if (root == window && _T._reservedNMS[subNms]) {
                return true;
            }

            //initial condition root set element not set or null
            //equals to element exists
            if (!subNms) {
                return true;
            }
            try {
                //special condition subnamespace exists as full blown key with . instead of function map
                if ('undefined' != typeof root[subNms]) {
                    return true;
                }

                //crossported from the dojo toolkit
                // summary: determine if an object supports a given method
                // description: useful for longer api chains where you have to test each object in the chain
                var p = subNms.split(".");
                var len = p.length;
                for (var i = 0; i < len; i++) {
                    //the original dojo code here was false because
                    //they were testing against ! which bombs out on exists
                    //which has a value set to false
                    // (TODO send in a bugreport to the Dojo people)

                    if ('undefined' == typeof root[p[i]]) {
                        return false;
                    } // Boolean
                    root = root[p[i]];
                }
                return true; // Boolean

            } catch (e) {
                //ie (again) has a special handling for some object attributes here which automatically throw an unspecified error if not existent
                return false;
            }
        };

        /**
         * A dojo like require to load scripts dynamically, note
         * to use this mechanism you have to set your global config param
         * myfacesScriptRoot to the root of your script files (aka under normal circumstances
         * resources/scripts)
         *
         * @param localOptions
         * @param configName
         * @param defaultValue
         */
        _T.require = function(nms) {
            //namespace exists
            if (_T.exists(nms)) return;
            var rootPath = _T.getGlobalConfig("myfacesScriptRoot", "");
            _T.loadScriptEval(rootPath + "/" + nms.replace(/\./g, "/") + ".js");
        },

        /**
         * fetches a global config entry
         * @param {String} configName the name of the configuration entry
         * @param {Object} defaultValue
         *
         * @return either the config entry or if none is given the default value
         */
        _T.getGlobalConfig = function(configName, defaultValue) {
            /**
             * note we could use exists but this is an heavy operation, since the config name usually
             * given this function here is called very often
             * is a single entry without . in between we can do the lighter shortcut
             */
            return (myfaces["config"] && 'undefined' != typeof myfaces.config[configName] ) ?
                    myfaces.config[configName]
                    :
                    defaultValue;
        };

        /**
         * gets the local or global options with local ones having higher priority
         * if no local or global one was found then the default value is given back
         *
         * @param {String} configName the name of the configuration entry
         * @param {String} localOptions the local options root for the configuration myfaces as default marker is added implicitely
         *
         * @param {Object} defaultValue
         *
         * @return either the config entry or if none is given the default value
         */
        _T.getLocalOrGlobalConfig = function(localOptions, configName, defaultValue) {
            /*use(myfaces._impl._util)*/
            var _local = !!localOptions;
            var _localResult;
            if (_local) {
                //note we also do not use exist here due to performance improvement reasons
                //not for now we loose the subnamespace capabilities but we do not use them anyway
                //this code will give us a performance improvement of 2-3%
                _localResult = (localOptions["myfaces"]) ? localOptions["myfaces"][configName] : undefined;
                _local = 'undefined' != typeof _localResult;
            }

            return (!_local) ? _T.getGlobalConfig(configName, defaultValue) : _localResult;
        };

        /**
         * determines the xhr level which either can be
         * 1 for classical level1
         * 1.5 for mozillas send as binary implementation
         * 2 for xhr level 2
         */
        _T.getXHRLvl = function() {
            if (!_T.XHR_LEVEL) {
                _T.getXHRObject();
            }
            return _T.XHR_LEVEL;
        };

        /**
         * encapsulated xhr object which tracks down various implementations
         * of the xhr object in a browser independent fashion
         * (ie pre 7 used to have non standard implementations because
         * the xhr object standard came after IE had implemented it first
         * newer ie versions adhere to the standard and all other new browsers do anyway)
         *
         * @return the xhr object according to the browser type
         */
        _T.getXHRObject = function() {
            //since this is a global object ie hates it if we do not check for undefined
            if (window.XMLHttpRequest) {
                var _ret = new XMLHttpRequest();
                //we now check the xhr level
                //sendAsBinary = 1.5 which means mozilla only
                //upload attribute present == level2
                /*
                if (!_T.XHR_LEVEL) {
                    var _e = _T.exists;
                    _T.XHR_LEVEL = (_e(_ret, "sendAsBinary")) ? 1.5 : 1;
                    _T.XHR_LEVEL = (_e(_ret, "upload") && 'undefined' != typeof FormData) ? 2 : _T.XHR_LEVEL;
                }*/
                return _ret;
            }
            //IE
            try {
                _T.XHR_LEVEL = 1;
                return new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {

            }
            return new ActiveXObject('Microsoft.XMLHTTP');
        };

        /**
         * loads a script and executes it under a global scope
         * @param {String} src  the source of the script
         * @param {String} type the type of the script
         * @param {Boolean} defer  defer true or false, same as the javascript tag defer param
         * @param {String} charSet the charset under which the script has to be loaded
         */
        _T.loadScriptEval = function(src, type, defer, charSet) {
            var xhr = _T.getXHRObject();
            xhr.open("GET", src, false);

            if (charSet) {
                xhr.setRequestHeader("Content-Type", "application/x-javascript; charset:" + charSet);
            }

            xhr.send(null);

            //since we are synchronous we do it after not with onReadyStateChange
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    //defer also means we have to process after the ajax response
                    //has been processed
                    //we can achieve that with a small timeout, the timeout
                    //triggers after the processing is done!
                    if (!defer) {
                        _T.globalEval(xhr.responseText.replace("\n", "\r\n") + "\r\n//@ sourceURL=" + src);
                    } else {
                        //TODO not ideal we maybe ought to move to something else here
                        //but since it is not in use yet, it is ok
                        setTimeout(function() {
                            _T.globalEval(xhr.responseText + "\r\n//@ sourceURL=" + src);
                        }, 1);
                    }
                } else {
                    throw Error(xhr.responseText);
                }
            } else {
                throw Error("Loading of script " + src + " failed ");
            }
        };

        /**
         * load script functionality which utilizes the browser internal
         * script loading capabilities
         *
         * @param {String} src  the source of the script
         * @param {String} type the type of the script
         * @param {Boolean} defer  defer true or false, same as the javascript tag defer param
         * @param {String} charSet the charset under which the script has to be loaded
         */
        _T.loadScriptByBrowser = function(src, type, defer, charSet) {
            //if a head is already present then it is safer to simply
            //use the body, some browsers prevent head alterations
            //after the first initial rendering

            //ok this is nasty we have to do a head modification for ie pre 8
            //the rest can be finely served with body
            var d = _T.browser;
            var position = "head"
            //if(!d.isIE || d.isIE >= 8) {
            //    position = document.getElementsByTagName("body").length ? "body" : "head";
            //}

            try {
                var holder = document.getElementsByTagName(position)[0];
                if ('undefined' == typeof holder || null == holder) {
                    holder = document.createElement(position);
                    var html = document.getElementsByTagName("html");
                    html.appendChild(holder);
                }
                var script = document.createElement("script");
                script.type = type || "text/javascript";
                script.src = src;
                if (charSet) {
                    script.charset = charSet;
                }
                if (defer) {
                    script.defer = defer;
                }

                //fix for the white page issue
                // if(_T.browser.isIE && _T.browser.isIE < 7) {
                //   holder.insertBefore( script, holder.firstChild );
                //   holder.removeChild( script );
                // } else {
                holder.appendChild(script);
                // }

            } catch (e) {
                //in case of a loading error we retry via eval    
                return false;
            }

            return true;
        };

        _T.loadScript = function(src, type, defer, charSet) {
            //the chrome engine has a nasty javascript bug which prevents
            //a correct order of scripts being loaded
            //if you use script source on the head, we  have to revert
            //to xhr+ globalEval for those
            if (!_T.browser.isFF) {
                _T.loadScriptEval(src, type, defer, charSet);
            } else {
                //only firefox keeps the order, sorry ie...
                _T.loadScriptByBrowser(src, type, defer, charSet)
            }
        };

        //Base Patterns, Inheritance, Delegation and Singleton

        /**
         * delegation pattern
         * usage:
         * this.delegateObject("my.name.space", delegate,
         * {
         *  constructor_ :function(bla, bla1) {
         *      _T._callDelegate("constructor", bla1);
         *  },
         *  myFunc: function(yyy) {
         *      DoSomething;
         *      _T._callDelegate("someOtherFunc", yyyy);
         *  }, null
         * });
         *
         * or
         * usage var newClass = this.delegateObject(
         * function (var1, var2) {
         *  _T._callDelegate("constructor", var1,var2);
         * };
         * ,delegateObject);
         * newClass.prototype.myMethod = function(arg1) {
         *      _T._callDelegate("myMethod", arg1,"hello world");
         *
         *
         * @param newCls the new class name to be generated
         * @param delegateObj the delegation object
         * @param protoFuncs the prototype functions which should be attached
         * @param nmsFuncs the namespace functions which should be attached to the namespace
         */
        _T.delegateObj = function(newCls, delegateObj, protoFuncs, nmsFuncs) {
            if (!_T.isString(newCls)) {
                throw Error("new class namespace must be of type String");
            }

            if ('function' != typeof newCls) {
                newCls = _reserveClsNms(newCls, protoFuncs);
                if (!newCls) return null;
            }

            //central delegation mapping core
            var proto = newCls.prototype;

            //the trick here is to isolate the entries to bind the
            //keys in a private scope see
            //http://www.ruzee.com/blog/2008/12/javascript-inheritance-via-prototypes-and-closures
            for (var key in delegateObj) (function(key, delFn) {
                //The isolation is needed otherwise the last _key assigend would be picked
                //up internally
                if (key && typeof delFn == "function") {
                    proto[key] = function(/*arguments*/) {
                        return delFn.apply(delegateObj, arguments);
                    };
                }
            })(key, delegateObj[key]);

            proto._delegateObj = delegateObj;
            proto.constructor = newCls;

            proto._callDelegate = function(methodName) {
                var passThrough = (arguments.length == 1) ? [] : Array.prototype.slice.call(arguments, 1);
                var ret = this._delegateObj[methodName].apply(this._delegateObj, passThrough);
                if ('undefined' != ret) return ret;
            };

            //we now map the function map in
            _applyFuncs(newCls, protoFuncs, true);
            _applyFuncs(newCls, nmsFuncs, false);

            return newCls;
        };

        /**
         * prototype based delegation inheritance
         *
         * implements prototype delegaton inheritance dest <- a
         *
         * usage var newClass = _T.extends( function (var1, var2) {
         *                                          _T._callSuper("constructor", var1,var2);
         *                                     };
         *                                  ,origClass);
         *
         *       newClass.prototype.myMethod = function(arg1) {
         *              _T._callSuper("myMethod", arg1,"hello world");
         *       ....
         *
         * other option
         *
         * myfaces._impl._core._Runtime.extends("myNamespace.newClass", parent, {
         *                              init: function() {constructor...},
         *                              method1: function(f1, f2) {},
         *                              method2: function(f1, f2,f3) {
         *                                  _T._callSuper("method2", F1,"hello world");
         *                              }
         *              });
         *
         * @param {function|String} newCls either a unnamed function which can be assigned later or a namespace
         * @param {function} extendCls the function class to be extended
         * @param {Object} protoFuncs (Map) an optional map of prototype functions which in case of overwriting a base function get an inherited method
         *
         * To explain further
         * prototype functions:
         *  newClass.prototype.<prototypeFunction>
         * namspace function
         *  newClass.<namespaceFunction> = function() {...}
         */

        _T.extendClass = function(newCls, extendCls, protoFuncs, nmsFuncs) {

            if (!_T.isString(newCls)) {
                throw Error("new class namespace must be of type String");
            }

            if (_T._reservedNMS[newCls]) {
                return;
            }

            if ('function' != typeof newCls) {
                newCls = _reserveClsNms(newCls, protoFuncs);
                if (!newCls) return null;
            }
            //if the type information is known we use that one
            //with this info we can inherit from objects also
            //instead of only from classes
            //sort of like   this.extendClass(newCls, extendObj._mfClazz...

            if (extendCls._mfClazz) {
                extendCls = extendCls._mfClazz;
            }

            if ('undefined' != typeof extendCls && null != extendCls) {
                //first we have to get rid of the constructor calling problem
                //problem
                var tmpFunc = function() {
                };
                tmpFunc.prototype = extendCls.prototype;
                newCls.prototype = new tmpFunc();
                tmpFunc = null;
                newCls.prototype.constructor = newCls;
                newCls.prototype._parentCls = extendCls.prototype;

                newCls.prototype._callSuper = function(methodName) {
                    var passThrough = (arguments.length == 1) ? [] : Array.prototype.slice.call(arguments, 1);

                    //we store the descension level of each method under a mapped
                    //name to avoid name clashes
                    //to avoid name clashes with internal methods of array
                    //if we don't do this we trap the callSuper in an endless
                    //loop after descending one level
                    var _mappedName = ["_",methodName,"_mf_r"].join("");
                    this._mfClsDescLvl = this._mfClsDescLvl || new Array();
                    var descLevel = this._mfClsDescLvl;
                    //we have to detect the descension level
                    //we now check if we are in a super descension for the current method already
                    //if not we are on this level
                    var _oldDescLevel = this._mfClsDescLvl[_mappedName] || this;
                    //we now step one level down
                    var _parentCls = _oldDescLevel._parentCls;

                    try {
                        //we now store the level position as new descension level for callSuper
                        descLevel[_mappedName] = _parentCls;
                        //and call the code on this
                        _parentCls[methodName].apply(this, passThrough);
                    } finally {
                        descLevel[_mappedName] = _oldDescLevel;
                    }
                };
                //reference to its own type
                newCls.prototype._mfClazz = newCls;
            }

            //we now map the function map in
            _applyFuncs(newCls, protoFuncs, true);
            //we could add inherited but that would make debugging harder
            //see http://www.ruzee.com/blog/2008/12/javascript-inheritance-via-prototypes-and-closures on how to do it

            _applyFuncs(newCls, nmsFuncs, false);

            return newCls;
        };

        /**
         * convenience method which basically replaces an existing class
         * with a new one under the same namespace, note all old functionality will be
         * presereced by pushing the original class into an new nampespace
         *
         * @param classNms the namespace for the class, must already be existing
         * @param protoFuncs the new prototype functions which are plugins for the old ones
         * @param overWrite if set to true replaces the old funcs entirely otherwise just does an implicit
         * inheritance with super being remapped
         *
         * TODO do not use this function yet it needs some refinement, it will be interesting later
         * anyway
         */
        _T.pluginClass = function(classNms, protoFuncs, overWrite) {
            var oldClass = _T.fetchNamespace(classNms);
            if (!oldClass) throw new Error("The class namespace " + classNms + " is not existent");

            if (!overWrite) {
                var preserveNMS = classNms + "." + ("" + _T._classReplacementCnt++);
                _T.reserveNamespace(preserveNMS, oldClass);

                return _T.extendClass(classNms, preserveNMS, protoFuncs);
            } else {
                //TODO constructor mapping?
                if (protoFuncs.constructor_) {
                    //TODO needs testing if this works!
                    newCls.prototype.constructor = protoFuncs.constructor_;
                }
                _applyFuncs(oldClass, protoFuncs, true);
            }
        },


        /**
         * Extends a class and puts a singleton instance at the reserved namespace instead
         * of its original class
         *
         * @param {function|String} newCls either a unnamed function which can be assigned later or a namespace
         * @param {function} extendsCls the function class to be extended
         * @param {Object} protoFuncs (Map) an optional map of prototype functions which in case of overwriting a base function get an inherited method
         */
        _T.singletonExtendClass = function(newCls, extendsCls, protoFuncs, nmsFuncs) {
            return _makeSingleton(_T.extendClass, newCls, extendsCls, protoFuncs, nmsFuncs);
        };

        /**
         * delegation pattern which attached singleton generation
         *
         * @param newCls the new namespace object to be generated as singletoin
         * @param delegateObj the object which has to be delegated
         * @param protoFuncs the prototype functions which are attached on prototype level
         * @param nmsFuncs the functions which are attached on the classes namespace level
         */
        _T.singletonDelegateObj = function(newCls, delegateObj, protoFuncs, nmsFuncs) {
            if (_T._reservedNMS[newCls]) {
                return;
            }
            return _makeSingleton(_T.delegateObj, newCls, delegateObj, protoFuncs, nmsFuncs);
        };

        //since the object is self contained and only
        //can be delegated we can work with real private
        //functions here, the other parts of the
        //system have to emulate them via _ prefixes
        var _makeSingleton = function(ooFunc, newCls, delegateObj, protoFuncs, nmsFuncs) {
            if (_T._reservedNMS[newCls]) {
                return;
            }

            var clazz = ooFunc(newCls + "._mfClazz", delegateObj, protoFuncs, nmsFuncs);
            if (clazz != null) {
                _T.applyToGlobalNamespace(newCls, new clazz());
            }
            _T.fetchNamespace(newCls)["_mfClazz"] = clazz;
        };

        //internal class namespace reservation depending on the type (string or function)
        var _reserveClsNms = function(newCls, protoFuncs) {
            var constr = null;

            if ('undefined' != typeof protoFuncs && null != protoFuncs) {
                constr = ('undefined' != typeof null != protoFuncs['constructor_'] && null != protoFuncs['constructor_']) ? protoFuncs['constructor_'] : function() {
                };
            } else {
                constr = function() {
                };
            }

            if (!_T.reserveNamespace(newCls, constr)) {
                return null;
            }
            newCls = _T.fetchNamespace(newCls);
            return newCls;
        };

        var _applyFuncs = function (newCls, funcs, proto) {
            if (funcs) {
                for (var key in funcs) {
                    //constructor already passed, callSuper already assigned
                    if ('undefined' == typeof key || null == key || key == "_callSuper") {
                        continue;
                    }
                    if (!proto)
                        newCls[key] = funcs[key];
                    else
                        newCls.prototype[key] = funcs[key];
                }
            }
        };

        /**
         * general type assertion routine
         *
         * @param probe the probe to be checked for the correct type
         * @param theType the type to be checked for
         */
        _T.assertType = function(probe, theType) {
            return _T.isString(theType) ? probe == typeof theType : probe instanceof theType;
        };

        /**
         * onload wrapper for chaining the onload cleanly
         * @param func the function which should be added to the load
         * chain (note we cannot rely on return values here, hence jsf.util.chain will fail)
         */
        _T.addOnLoad = function(target, func) {
            var oldonload = (target)? target.onload: null;
            target.onload = (!oldonload || !_T.assertType(oldonload, "function")) ? func : function() {
                oldonload();
                func();
            };
        };

        /**
         * returns the internationalisation setting
         * for the given browser so that
         * we can i18n our messages
         *
         * @returns a map with following entires:
         * <ul>
         *      <li>language: the lowercase language iso code</li>
         *      <li>variant: the uppercase variant iso code</li>
         * </ul>
         * null is returned if the browser fails to determine the language settings
         */
        _T.getLanguage = function(lOverride) {
            var deflt = {language: "en", variant: "UK"}; //default language and variant
            try {
                var lang = lOverride || navigator.language || navigator.browserLanguage;
                if(!lang || lang.length < 2) return deflt;
                return {
                    language: lang.substr(0,2),
                    variant: (lang.length >=5)?lang.substr(3,5): null
                };
            } catch(e) {
                return deflt;    
            }
        };




        //initial browser detection, we encapsule it in a closure
        //to drop all temporary variables from ram as soon as possible
        (function() {
            /**
             * browser detection code
             * cross ported from dojo 1.2
             *
             * dojos browser detection code is very sophisticated
             * hence we port it over it allows a very fine grained detection of
             * browsers including the version number
             * this however only can work out if the user
             * does not alter the user agent, which they normally dont!
             *
             * the exception is the ie detection which relies on specific quirks in ie
             */
            var n = navigator;
            var dua = n.userAgent,
                    dav = n.appVersion,
                    tv = parseFloat(dav);


            _T.browser = {};
            var d = _T.browser;

            if (dua.indexOf("Opera") >= 0) {
                _T.isOpera = tv;
            }
            if (dua.indexOf("AdobeAIR") >= 0) {
                d.isAIR = 1;
            }
            if (dua.indexOf("BlackBerry") >= 0) {
                d.isBlackBerry = tv;
            }
            d.isKhtml = (dav.indexOf("Konqueror") >= 0) ? tv : 0;
            d.isWebKit = parseFloat(dua.split("WebKit/")[1]) || undefined;
            d.isChrome = parseFloat(dua.split("Chrome/")[1]) || undefined;


            // safari detection derived from:
            //		http://developer.apple.com/internet/safari/faq.html#anchor2
            //		http://developer.apple.com/internet/safari/uamatrix.html
            var index = Math.max(dav.indexOf("WebKit"), dav.indexOf("Safari"), 0);
            if (index && !d.isChrome) {
                // try to grab the explicit Safari version first. If we don't get
                // one, look for less than 419.3 as the indication that we're on something
                // "Safari 2-ish".
                d.isSafari = parseFloat(dav.split("Version/")[1]);
                if (!d.isSafari || parseFloat(dav.substr(index + 7)) <= 419.3) {
                    d.isSafari = 2;
                }
            }

            //>>excludeStart("webkitMobile", kwArgs.webkitMobile);

            if (dua.indexOf("Gecko") >= 0 && !d.isKhtml && !d.isWebKit) {
                d.isMozilla = d.isMoz = tv;
            }
            if (d.isMoz) {
                //We really need to get away from _T. Consider a sane isGecko approach for the future.
                d.isFF = parseFloat(dua.split("Firefox/")[1] || dua.split("Minefield/")[1] || dua.split("Shiretoko/")[1]) || undefined;
            }

            if (document.all && !d.isOpera && !d.isBlackBerry) {
                d.isIE = parseFloat(dav.split("MSIE ")[1]) || undefined;
                d.isIEMobile = parseFloat(dua.split("IEMobile")[1]);
                //In cases where the page has an HTTP header or META tag with
                //X-UA-Compatible, then it is in emulation mode, for a previous
                //version. Make sure isIE reflects the desired version.
                //document.documentMode of 5 means quirks mode.

                /** @namespace document.documentMode */
                if (d.isIE >= 8 && document.documentMode != 5) {
                    d.isIE = document.documentMode;
                }
            }
        })();

    };
}
