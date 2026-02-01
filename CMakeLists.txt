cmake_minimum_required(VERSION 3.25.0)

include(FetchContent)

#project name
project (llhttp-wasm-ts VERSION 0.1)

FetchContent_Declare(
  llhttp
  URL "https://github.com/nodejs/llhttp/archive/refs/tags/release/v9.3.0.tar.gz"
)

set(BUILD_SHARED_LIBS OFF CACHE INTERNAL "")
set(BUILD_STATIC_LIBS ON CACHE INTERNAL "")
FetchContent_MakeAvailable(llhttp)

FetchContent_Declare(
  wasi-sdk
  URL "https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-29/wasi-sdk-29.0-x86_64-linux.tar.gz"
)

FetchContent_MakeAvailable(wasi-sdk)

# Link with the llhttp_static target
target_link_libraries(llhttp_static llhttp-wasm-ts)


# add_library(llhttp)

# target_sources(MyLibrary
#   PRIVATE
#     library_implementation.cxx

#   PUBLIC
#     FILE_SET myHeaders
#     TYPE HEADERS
#     BASE_DIRS
#       include
#     FILES
#       include/library_header.h
# )