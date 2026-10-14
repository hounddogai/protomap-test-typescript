import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalOptOutExceptionStore } from "./global-opt-out-exception-store.js";
import { newGlobalOptOutException } from "./global-opt-out-exception.js";

test("MemoryGlobalOptOutExceptionStore finds what it saved", () => {
  const store = newMemoryGlobalOptOutExceptionStore();
  const item = newGlobalOptOutException("code-573", "title-492");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
