import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierCheckpointStore } from "./tier-checkpoint-store.js";
import { newTierCheckpoint } from "./tier-checkpoint.js";

test("MemoryTierCheckpointStore finds what it saved", () => {
  const store = newMemoryTierCheckpointStore();
  const item = newTierCheckpoint("code-511", "name-389");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
