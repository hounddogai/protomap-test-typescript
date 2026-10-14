import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyWaitCheckpointStore } from "./legacy-wait-checkpoint-store.js";
import { newLegacyWaitCheckpoint } from "./legacy-wait-checkpoint.js";

test("MemoryLegacyWaitCheckpointStore finds what it saved", () => {
  const store = newMemoryLegacyWaitCheckpointStore();
  const item = newLegacyWaitCheckpoint("code-897", "title-833");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
