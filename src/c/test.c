#include "stdio.h"

__attribute__((visibility("default"))) void test(void) {
  printf("ASD\n");
  fflush(stdout);
}