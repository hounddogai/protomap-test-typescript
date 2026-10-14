import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPathCycleStore } from "./batched-path-cycle-store.js";
import { newBatchedPathCycle } from "./batched-path-cycle.js";

test("MemoryBatchedPathCycleStore finds what it saved", () => {
  const store = newMemoryBatchedPathCycleStore();
  const item = newBatchedPathCycle("code-308", "label-204");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
