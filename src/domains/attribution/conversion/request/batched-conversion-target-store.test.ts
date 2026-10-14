import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedConversionTargetStore } from "./batched-conversion-target-store.js";
import { newBatchedConversionTarget } from "./batched-conversion-target.js";

test("MemoryBatchedConversionTargetStore finds what it saved", () => {
  const store = newMemoryBatchedConversionTargetStore();
  const item = newBatchedConversionTarget("code-942", "name-599");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
