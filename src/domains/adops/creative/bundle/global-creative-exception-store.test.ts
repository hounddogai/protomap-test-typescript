import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalCreativeExceptionStore } from "./global-creative-exception-store.js";
import { newGlobalCreativeException } from "./global-creative-exception.js";

test("MemoryGlobalCreativeExceptionStore finds what it saved", () => {
  const store = newMemoryGlobalCreativeExceptionStore();
  const item = newGlobalCreativeException("code-662", "label-218");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
