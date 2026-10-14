import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyQueueCheckpointStore } from "./legacy-queue-checkpoint-store.js";
import { newLegacyQueueCheckpoint } from "./legacy-queue-checkpoint.js";

test("MemoryLegacyQueueCheckpointStore finds what it saved", () => {
  const store = newMemoryLegacyQueueCheckpointStore();
  const item = newLegacyQueueCheckpoint("code-659", "label-142");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
