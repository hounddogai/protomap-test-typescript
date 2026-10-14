import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementCheckpointStore } from "./placement-checkpoint-store.js";
import { newPlacementCheckpoint } from "./placement-checkpoint.js";

test("MemoryPlacementCheckpointStore finds what it saved", () => {
  const store = newMemoryPlacementCheckpointStore();
  const item = newPlacementCheckpoint("code-257", "label-422");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
