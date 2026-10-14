import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceExceptionStore } from "./bounce-exception-store.js";
import { newBounceException } from "./bounce-exception.js";

test("MemoryBounceExceptionStore finds what it saved", () => {
  const store = newMemoryBounceExceptionStore();
  const item = newBounceException("code-621", "label-325");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
