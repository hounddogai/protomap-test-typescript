import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalModelExceptionStore } from "./global-model-exception-store.js";
import { newGlobalModelException } from "./global-model-exception.js";

test("MemoryGlobalModelExceptionStore finds what it saved", () => {
  const store = newMemoryGlobalModelExceptionStore();
  const item = newGlobalModelException("code-283", "title-101");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
