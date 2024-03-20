/*
ading2210/libcurl.js - A port of libcurl to WASM for the browser.
Copyright (C) 2023 ading2210

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

//everything is wrapped in a function to prevent emscripten from polluting the global scope
const libcurl = (function() {

//emscripten compiled code is inserted here
/* __emscripten_output__ */

//extra client code goes here
/* __extra_libraries__ */

var websocket_url = null;
var wasm_ready = false;
var version_dict = null;
var api = null;
var main_session = null;
const libcurl_version = "__library_version__";
const wisp_version = "__wisp_version__";

function check_loaded(check_websocket) {
  if (!wasm_ready) {
    throw new Error("wasm not loaded yet, please call libcurl.load_wasm first");
  }
  if (!websocket_url && check_websocket) {
    throw new Error("websocket proxy url not set, please call libcurl.set_websocket");
  }
}
function set_websocket_url(url) {
  websocket_url = url;
  if (Module.websocket) {
    Module.websocket.url = url;
  }
  if (!main_session && wasm_ready) {
    setup_main_session();
  }
}

function get_version() {
  if (!wasm_ready) return null;
  if (version_dict) return version_dict;

  let version_ptr = _get_version();
  let version_str = UTF8ToString(version_ptr);
  _free(version_ptr);
  version_dict = JSON.parse(version_str);
  version_dict.lib = libcurl_version;
  version_dict.wisp = wisp_version;
  return version_dict;
}

function get_cacert() {
  return UTF8ToString(_get_cacert());
}

function setup_main_session() {
  main_session = new HTTPSession();
  api.fetch = main_session.fetch.bind(main_session);
}

function main() {
  wasm_ready = true;
  _init_curl();

  if (ENVIRONMENT_IS_WEB) {
    let load_event = new Event("libcurl_load");
    document.dispatchEvent(load_event);
  }

  if (!main_session && websocket_url) {
    setup_main_session();
  }

  api.onload();
}

function load_wasm(url) {
  wasmBinaryFile = url;
  createWasm();
  run();
}

Module.onRuntimeInitialized = main;
api = {
  set_websocket: set_websocket_url,
  load_wasm: load_wasm,
  get_cacert: get_cacert,
  get_error_string: get_error_str,

  wisp_connections: _wisp_connections,
  WispConnection: WispConnection,
  transport: "wisp",

  WebSocket: WebSocket,
  CurlWebSocket: CurlWebSocket,
  TLSSocket: TLSSocket,
  HTTPSession: HTTPSession,
  fetch() {throw "not ready"},
  
  get copyright() {return copyright_notice},
  get version() {return get_version()},
  get ready() {return wasm_ready},
  get websocket_url() {return websocket_url},

  get stdout() {return out},
  set stdout(callback) {out = callback},
  get stderr() {return err},
  set stderr(callback) {err = callback},
  get logger() {return logger},
  set logger(func) {logger = func},

  onload() {}
};

return api;

})()