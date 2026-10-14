import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPlacementExceptionStore } from "./rolling-placement-exception-store.js";
import { newRollingPlacementException } from "./rolling-placement-exception.js";

test("MemoryRollingPlacementExceptionStore finds what it saved", () => {
  const store = newMemoryRollingPlacementExceptionStore();
  const item = newRollingPlacementException("code-317", "name-447");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
