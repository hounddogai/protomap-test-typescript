import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredSlaCheckpointStore } from "./tiered-sla-checkpoint-store.js";
import { newTieredSlaCheckpoint } from "./tiered-sla-checkpoint.js";

test("MemoryTieredSlaCheckpointStore finds what it saved", () => {
  const store = newMemoryTieredSlaCheckpointStore();
  const item = newTieredSlaCheckpoint("code-211", "title-411");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
