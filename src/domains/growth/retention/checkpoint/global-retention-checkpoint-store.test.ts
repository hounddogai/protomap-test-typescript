import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalRetentionCheckpointStore } from "./global-retention-checkpoint-store.js";
import { newGlobalRetentionCheckpoint } from "./global-retention-checkpoint.js";

test("MemoryGlobalRetentionCheckpointStore finds what it saved", () => {
  const store = newMemoryGlobalRetentionCheckpointStore();
  const item = newGlobalRetentionCheckpoint("code-597", "title-155");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
