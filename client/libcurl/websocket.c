#include <stdlib.h>

#include "curl/curl.h"
#include "curl/websockets.h"

#include "types.h"

extern CURLM* multi_handle;

struct WSResult* recv_from_websocket(CURL* http_handle, int buffer_size) {
  const struct curl_ws_frame* ws_meta;
  char* buffer = malloc(buffer_size);
  size_t result_len;
  CURLcode res = curl_ws_recv(http_handle, buffer, buffer_size, &result_len, &ws_meta);

  struct WSResult* result = malloc(sizeof(struct WSResult));
  result->buffer_size = result_len;
  result->buffer = buffer;
  result->res = (int) res;
  result->closed = (ws_meta->flags & CURLWS_CLOSE);
  result->is_text = (ws_meta->flags & CURLWS_TEXT);
  result->bytes_left = ws_meta->bytesleft;
  return result;
}

int send_to_websocket(CURL* http_handle, const char* data, int data_len, int is_text) {
  size_t sent;
  unsigned int flags = CURLWS_BINARY;
  if (is_text) flags = CURLWS_TEXT;
  CURLcode res = curl_ws_send(http_handle, data, data_len, &sent, 0, flags);
  return (int) res;
}

void close_websocket(CURL* http_handle) {
  size_t sent;
  curl_ws_send(http_handle, "", 0, &sent, 0, CURLWS_CLOSE);
}

//clean up the http handle associated with the websocket, since the main loop can't do this automatically
void cleanup_handle(CURL* http_handle) {
  struct RequestInfo *request_info;
  curl_easy_getinfo(http_handle, CURLINFO_PRIVATE, &request_info);

  curl_multi_remove_handle(multi_handle, http_handle);
  curl_easy_cleanup(http_handle);
  free(request_info);
}

int get_result_size (const struct WSResult* result) {
  return result->buffer_size;
}
char* get_result_buffer (const struct WSResult* result) {
  return result->buffer;
}
int get_result_code (const struct WSResult* result) {
  return result->res;
}
int get_result_closed (const struct WSResult* result) {
  return result->closed;
}
int get_result_bytes_left (const struct WSResult* result) {
  return result->bytes_left;
}
int get_result_is_text (const struct WSResult* result) {
  return result->is_text;
}