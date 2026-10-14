import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedEscalationRollupStore } from "./batched-escalation-rollup-store.js";
import { newBatchedEscalationRollup } from "./batched-escalation-rollup.js";

test("MemoryBatchedEscalationRollupStore finds what it saved", () => {
  const store = newMemoryBatchedEscalationRollupStore();
  const item = newBatchedEscalationRollup("code-65", "title-137");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
