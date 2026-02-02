cmake_minimum_required(VERSION 3.25.0)
include(FetchContent)
include(CMakePrintHelpers)

FetchContent_Declare(
  wasi_sdk
  URL "https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-29/wasi-sdk-29.0-x86_64-linux.tar.gz"
)
FetchContent_Declare(
  llhttp
  GIT_REPOSITORY "https://github.com/nodejs/llhttp.git"
  GIT_TAG release/v9.3.0
)

FetchContent_Declare(
  llhttp_src
  GIT_REPOSITORY "https://github.com/nodejs/llhttp.git"
  GIT_TAG v9.3.0
)

FetchContent_Populate(wasi_sdk)
FetchContent_Populate(llhttp_src)
FetchContent_Populate(llhttp)
FetchContent_GetProperties(wasi_sdk)
FetchContent_GetProperties(llhttp)
set(WASI 1)

set(CMAKE_TOOLCHAIN_FILE ${wasi_sdk_SOURCE_DIR}/share/cmake/wasi-sdk.cmake)

project (llhttp-wasm-ts VERSION 0.1)

set(BUILD_SHARED_LIBS OFF CACHE INTERNAL "")
set(BUILD_STATIC_LIBS OFF CACHE INTERNAL "")

add_compile_options(
  -fno-exceptions
  -fvisibility=hidden
)

add_link_options(
  -mexec-model=reactor
  -Wl,-error-limit=0
  -Wl,-O3
  -Wl,--lto-O3
  -Wl,--strip-all
  -Wl,--allow-undefined
  -Wl,--export-dynamic
  -Wl,--export-table
  -Wl,--export=malloc
  -Wl,--export=free
  -Wl,--no-entry
)

file(GLOB llhttp_c_files
     ${llhttp_SOURCE_DIR}/src/*.c
)

# cmake_print_variables(llhttp_SOURCE_DIR llhttp_c_files)

include_directories(${llhttp_SOURCE_DIR}/include)

add_executable(
  llhttp.wasm
  ${llhttp_c_files}
)

# target_link_libraries(llhttp_wasm llhttp-wasm-ts)




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