import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingStepRollupStore } from "./pending-step-rollup-store.js";
import { newPendingStepRollup } from "./pending-step-rollup.js";

test("MemoryPendingStepRollupStore finds what it saved", () => {
  const store = newMemoryPendingStepRollupStore();
  const item = newPendingStepRollup("code-223", "label-972");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
