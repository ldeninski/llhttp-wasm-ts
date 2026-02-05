#include <stdlib.h>
#include "stdio.h"
#include "llhttp.h"
#include "string.h"

#define WASM_EXPORT __attribute__((visibility("default")))

// no enum here -> we need to know the exact size of this field
const uint32_t CB_TYPE_on_chunk_complete = 1;
const uint32_t CB_TYPE_on_chunk_extension_name_complete = 2;
const uint32_t CB_TYPE_on_chunk_extension_value_complete = 3;
const uint32_t CB_TYPE_on_chunk_header = 4;
const uint32_t CB_TYPE_on_header_field_complete = 5;
const uint32_t CB_TYPE_on_header_value_complete = 6;
const uint32_t CB_TYPE_on_headers_complete = 7;
const uint32_t CB_TYPE_on_message_begin = 8;
const uint32_t CB_TYPE_on_message_complete = 9;
const uint32_t CB_TYPE_on_method_complete = 10;
const uint32_t CB_TYPE_on_protocol_complete = 11;
const uint32_t CB_TYPE_on_reset = 12;
const uint32_t CB_TYPE_on_status_complete = 13;
const uint32_t CB_TYPE_on_url_complete = 14;
const uint32_t CB_TYPE_on_version_complete = 15;
const uint32_t CB_TYPE_on_body = 16;
const uint32_t CB_TYPE_on_chunk_extension_name = 17;
const uint32_t CB_TYPE_on_chunk_extension_value = 18;
const uint32_t CB_TYPE_on_header_field = 19;
const uint32_t CB_TYPE_on_header_value = 20;
const uint32_t CB_TYPE_on_method = 21;
const uint32_t CB_TYPE_on_protocol = 22;
const uint32_t CB_TYPE_on_status = 23;
const uint32_t CB_TYPE_on_url = 24;
const uint32_t CB_TYPE_on_version = 25;


typedef struct {
	uint32_t 						last_cb;
	const char *				last_pos;
	size_t							last_size;
	int									last_error;
	const char *				buffer;
	size_t							size;
} hg_state_t;


typedef struct {
	llhttp_t _llhttp_int;
	union {
		hg_state_t 	state;
		struct {
			uint32_t 						last_cb;
			const char *				last_pos;
			size_t							last_size;
			int									last_error;
			const char *				buffer;
			size_t							size;
		};
	};
} llhttp_ext;


WASM_EXPORT uint16_t hg_get_prt_size(void) {
	return sizeof(size_t);
};

WASM_EXPORT uint32_t hg_get_last_cb(hg_state_t * state) {
	return state->last_cb;
}
WASM_EXPORT const char * hg_get_last_pos(hg_state_t * state) {
	return state->last_pos;
}
WASM_EXPORT size_t hg_get_last_size(hg_state_t * state) {
	return state->last_size;
}
WASM_EXPORT int hg_get_last_error(hg_state_t * state) {
	return state->last_cb;
}

#define CB_WRAP(CB) 																	\
static inline int cb_##CB(llhttp_t* _parser) { 		\
	llhttp_ext* parser = (llhttp_ext*)_parser;					\
	parser->last_cb = CB_TYPE_##CB;											\
	return HPE_PAUSED;																	\
};

#define CB_DATA_WRAP(CB) 														\
static inline int cb_##CB(llhttp_t* _parser, const char *pos, size_t size) { 		\
	llhttp_ext* parser = (llhttp_ext*)_parser;					\
	parser->last_cb = CB_TYPE_##CB;											\
	parser->last_pos = pos;															\
	parser->last_size = size;														\
	return HPE_PAUSED;																	\
};

CB_WRAP(on_chunk_complete);
CB_WRAP(on_chunk_extension_name_complete);
CB_WRAP(on_chunk_extension_value_complete);
CB_WRAP(on_chunk_header);
CB_WRAP(on_header_field_complete);
CB_WRAP(on_header_value_complete);
CB_WRAP(on_headers_complete);
CB_WRAP(on_message_begin);
CB_WRAP(on_message_complete);
CB_WRAP(on_method_complete);
CB_WRAP(on_protocol_complete);
CB_WRAP(on_reset);
CB_WRAP(on_status_complete);
CB_WRAP(on_url_complete);
CB_WRAP(on_version_complete);

CB_DATA_WRAP(on_body);
CB_DATA_WRAP(on_chunk_extension_name);
CB_DATA_WRAP(on_chunk_extension_value);
CB_DATA_WRAP(on_header_field);
CB_DATA_WRAP(on_header_value);
CB_DATA_WRAP(on_method);
CB_DATA_WRAP(on_protocol);
CB_DATA_WRAP(on_status);
CB_DATA_WRAP(on_url);
CB_DATA_WRAP(on_version);

WASM_EXPORT hg_state_t hg_begin(llhttp_ext* parser, const char* data, size_t size);

void attach_cb(llhttp_settings_t *settings) {
	settings->on_chunk_complete = cb_on_chunk_complete;
	settings->on_chunk_extension_name_complete = cb_on_chunk_extension_name_complete;
	settings->on_chunk_extension_value_complete = cb_on_chunk_extension_value_complete;
	settings->on_chunk_header = cb_on_chunk_header;
	settings->on_header_field_complete = cb_on_header_field_complete;
	settings->on_header_value_complete = cb_on_header_value_complete;
	settings->on_headers_complete = cb_on_headers_complete;
	settings->on_message_begin = cb_on_message_begin;
	settings->on_message_complete = cb_on_message_complete;
	settings->on_method_complete = cb_on_method_complete;
	settings->on_protocol_complete = cb_on_protocol_complete;
	settings->on_reset = cb_on_reset;
	settings->on_status_complete = cb_on_status_complete;
	settings->on_url_complete = cb_on_url_complete;
	settings->on_version_complete = cb_on_version_complete;

	settings->on_body = cb_on_body;
	settings->on_chunk_extension_name = cb_on_chunk_extension_name;
	settings->on_chunk_extension_value = cb_on_chunk_extension_value;
	settings->on_header_field = cb_on_header_field;
	settings->on_header_value = cb_on_header_value;
	settings->on_method = cb_on_method;
	settings->on_protocol = cb_on_protocol;
	settings->on_status = cb_on_status;
	settings->on_url = cb_on_url;
	settings->on_version = cb_on_version;
}

WASM_EXPORT llhttp_ext* hg_create(llhttp_type_t type) {
	llhttp_t* parser = malloc(sizeof(llhttp_ext));
	llhttp_settings_t* settings = malloc(sizeof(llhttp_settings_t));
	attach_cb(settings);
  llhttp_init(parser, type, settings);
  return (llhttp_ext*)parser;
}

WASM_EXPORT void hg_destroy(llhttp_t* parser) {
	free(parser->settings);
	free(parser);
}

WASM_EXPORT hg_state_t hg_next(llhttp_ext* parser) {
	llhttp_resume((llhttp_t *)parser);
	const char * error_pos = llhttp_get_error_pos((llhttp_t *)parser);
	
	return hg_begin(parser, error_pos, parser->size - (error_pos - parser->buffer));
}

WASM_EXPORT hg_state_t hg_begin(llhttp_ext* parser, const char* data, size_t size) {
	parser->buffer = data;
	parser->size = size;

	int last_error = llhttp_execute((llhttp_t *)parser, data, size);
	if (last_error != HPE_PAUSED) {
		parser->last_error = last_error;
		return parser->state;
	}
	
	parser->last_error = HPE_OK;
	return parser->state;
}
