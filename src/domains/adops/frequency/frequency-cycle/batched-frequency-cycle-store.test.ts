import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedFrequencyCycleStore } from "./batched-frequency-cycle-store.js";
import { newBatchedFrequencyCycle } from "./batched-frequency-cycle.js";

test("MemoryBatchedFrequencyCycleStore finds what it saved", () => {
  const store = newMemoryBatchedFrequencyCycleStore();
  const item = newBatchedFrequencyCycle("code-460", "label-928");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
