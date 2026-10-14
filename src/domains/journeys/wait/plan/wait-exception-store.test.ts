import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitExceptionStore } from "./wait-exception-store.js";
import { newWaitException } from "./wait-exception.js";

test("MemoryWaitExceptionStore finds what it saved", () => {
  const store = newMemoryWaitExceptionStore();
  const item = newWaitException("code-661", "title-284");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
