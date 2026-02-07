#include <stdlib.h>
#include "stdio.h"
#include "llhttp.h"
#include "string.h"

#define WASM_EXPORT __attribute__((visibility("default")))

// #define DEBUG

#ifdef DEBUG
#define DBG_LOG(fmt, ...)                  \
	do                                     \
	{                                      \
		fprintf(stdout, fmt, __VA_ARGS__); \
		fflush(stdout);                    \
	} while (0)
#else
#define DBG_LOG(...)
#endif

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

const uint32_t CB_COMPLETE_MAX = CB_TYPE_on_version_complete;

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
	llhttp_t _llhttp_int;

	struct {
		uint32_t serial;

		uint32_t last_cb;
		size_t last_pos;
		size_t last_size;

		size_t prev_pos;
		size_t prev_size;
		uint32_t prev_cb;

		int last_error;
		const char* buffer;
		const char* subBuffer;
		size_t size;
		size_t subSize;
	};
} llhttp_ext;

WASM_EXPORT uint16_t hg_get_prt_size(void) {
	return sizeof(size_t);
};

WASM_EXPORT uint32_t hg_get_serial(llhttp_ext* parser) {
	return parser->serial;
}
WASM_EXPORT uint32_t hg_get_last_cb(llhttp_ext* parser) {
	return parser->last_cb;
}
WASM_EXPORT size_t hg_get_last_pos(llhttp_ext* parser) {
	return parser->last_pos;
}
WASM_EXPORT size_t hg_get_last_size(llhttp_ext* parser) {
	return parser->last_size;
}
WASM_EXPORT int hg_get_last_error(llhttp_ext* parser) {
	return parser->last_error;
}

WASM_EXPORT void hg_print_error_reason(llhttp_t* parser) {
	printf("Error Resona: %s\n", llhttp_get_error_reason(parser));
	fflush(stdout);
}

#define CB_WRAP(CB) \
	static inline int cb_##CB(llhttp_t *_parser) { \
		llhttp_ext *parser = (llhttp_ext *)_parser;  \
		parser->last_cb = CB_TYPE_##CB;              \
		parser->prev_cb = CB_TYPE_##CB;              \
		parser->serial++;														 \
		DBG_LOG("%s\ts: %d,e: %d, pos: %d, size: %d \n", #CB, parser->serial, parser->last_error, parser->last_pos, parser->last_size);	\
		return HPE_PAUSED;                           \
	};

#define CB_DATA_WRAP(CB) \
	static inline int cb_##CB(llhttp_t *_parser, const char *pos, size_t size) { \
		llhttp_ext *parser = (llhttp_ext *)_parser;                                \
		DBG_LOG(">%s\t\t\ts: %d,e: %d, pos: %d, size: %d \n", #CB, parser->serial, parser->last_error, parser->last_pos, parser->last_size);	\
		parser->last_cb = CB_TYPE_##CB;                                            \
		parser->last_pos = pos - parser->buffer;                                   \
		parser->last_size = size;                                                  \
		if ( \
			parser->serial == 0 || \
			parser->last_cb != parser->prev_cb || \
			parser->last_pos != parser->prev_pos || \
			parser->last_size != parser->prev_size \
		) parser->serial++; \
		parser->prev_cb = parser->last_cb; \
		parser->prev_pos = parser->last_pos; \
		parser->prev_size = parser->last_size; \
		DBG_LOG("<%s\t\t\ts: %d,e: %d, pos: %d, size: %d \n", #CB, parser->serial, parser->last_error, parser->last_pos, parser->last_size);	\
		return HPE_PAUSED;                                                         \
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

void attach_cb(llhttp_settings_t* settings) {
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
	DBG_LOG("hg_create(%d) \n", type);
	llhttp_t* parser = malloc(sizeof(llhttp_ext));
	llhttp_settings_t* settings = malloc(sizeof(llhttp_settings_t));
	attach_cb(settings);
	llhttp_init(parser, type, settings);
	llhttp_set_lenient_optional_cr_before_lf(parser, 1);
	llhttp_set_lenient_optional_lf_after_cr(parser, 1);
	return (llhttp_ext*)parser;
}

WASM_EXPORT void hg_destroy(llhttp_t* parser) {
	free(parser->settings);
	free(parser);
}

WASM_EXPORT llhttp_errno_t hg_begin(llhttp_ext* parser, char* data, size_t size) {
	DBG_LOG("hg_begin(%d, %d, %d) \n", parser, data, size);
	parser->buffer = data;
	parser->size = size;
	parser->subBuffer = data;
	parser->subSize = size;

	llhttp_errno_t last_error = llhttp_execute((llhttp_t*)parser, data, size);
	parser->last_error = last_error;

	return last_error;
}

WASM_EXPORT llhttp_errno_t hg_next(llhttp_ext* parser) {
	llhttp_resume((llhttp_t*)parser);
	const char* error_pos = llhttp_get_error_pos((llhttp_t*)parser);

	parser->subSize = parser->subSize - (error_pos - parser->subBuffer);
	parser->subBuffer = error_pos;

	llhttp_errno_t last_error = llhttp_execute(parser, parser->subBuffer, parser->subSize);
	parser->last_error = last_error;

	return last_error;
}

WASM_EXPORT char* hg_malloc(size_t size) {
	char* buffer = malloc(size);
	memset(buffer, 0, size);

	if (!buffer)
		return NULL;

	return buffer;
}

WASM_EXPORT void hg_free(char* buffer) {
	if (buffer) {
		free(buffer);
	}
}

WASM_EXPORT void hg_write(char* pos, size_t size,
	uint32_t w01,
	uint32_t w02,
	uint32_t w03,
	uint32_t w04,
	uint32_t w05,
	uint32_t w06,
	uint32_t w07,
	uint32_t w08,
	uint32_t w09,
	uint32_t w10,
	uint32_t w11,
	uint32_t w12,
	uint32_t w13,
	uint32_t w14,
	uint32_t w15,
	uint32_t w16) {
	if (size > 16 * 4) {
		DBG_LOG("hg_write cannot write more than %d bytes at a time called with %d bytes", 16 * 4, size);
		return;
	}
	uint32_t localBuf[] = {
		w01,
		w02,
		w03,
		w04,
		w05,
		w06,
		w07,
		w08,
		w09,
		w10,
		w11,
		w12,
		w13,
		w14,
		w15,
		w16 };

	memcpy(pos, &localBuf, size * 4);
}

WASM_EXPORT void hg_dump(char* buffer) {
	printf("\"%s\"\n", buffer);
	fflush(stdout);
}