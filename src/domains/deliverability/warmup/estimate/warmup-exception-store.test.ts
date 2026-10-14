import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupExceptionStore } from "./warmup-exception-store.js";
import { newWarmupException } from "./warmup-exception.js";

test("MemoryWarmupExceptionStore finds what it saved", () => {
  const store = newMemoryWarmupExceptionStore();
  const item = newWarmupException("code-153", "name-525");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
