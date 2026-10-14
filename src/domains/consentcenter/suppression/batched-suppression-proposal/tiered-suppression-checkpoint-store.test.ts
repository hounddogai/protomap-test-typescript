import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredSuppressionCheckpointStore } from "./tiered-suppression-checkpoint-store.js";
import { newTieredSuppressionCheckpoint } from "./tiered-suppression-checkpoint.js";

test("MemoryTieredSuppressionCheckpointStore finds what it saved", () => {
  const store = newMemoryTieredSuppressionCheckpointStore();
  const item = newTieredSuppressionCheckpoint("code-546", "name-204");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
