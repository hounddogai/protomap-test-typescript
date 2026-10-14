import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalSuppressionCheckpointStore } from "./global-suppression-checkpoint-store.js";
import { newGlobalSuppressionCheckpoint } from "./global-suppression-checkpoint.js";

test("MemoryGlobalSuppressionCheckpointStore finds what it saved", () => {
  const store = newMemoryGlobalSuppressionCheckpointStore();
  const item = newGlobalSuppressionCheckpoint("code-673", "title-277");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
