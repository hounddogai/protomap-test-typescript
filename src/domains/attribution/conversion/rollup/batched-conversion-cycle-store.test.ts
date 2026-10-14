import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedConversionCycleStore } from "./batched-conversion-cycle-store.js";
import { newBatchedConversionCycle } from "./batched-conversion-cycle.js";

test("MemoryBatchedConversionCycleStore finds what it saved", () => {
  const store = newMemoryBatchedConversionCycleStore();
  const item = newBatchedConversionCycle("code-845", "label-911");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
