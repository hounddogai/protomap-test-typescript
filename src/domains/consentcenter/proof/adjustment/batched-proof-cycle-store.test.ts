import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedProofCycleStore } from "./batched-proof-cycle-store.js";
import { newBatchedProofCycle } from "./batched-proof-cycle.js";

test("MemoryBatchedProofCycleStore finds what it saved", () => {
  const store = newMemoryBatchedProofCycleStore();
  const item = newBatchedProofCycle("code-754", "title-545");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
