import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationCheckpointStore } from "./reputation-checkpoint-store.js";
import { newReputationCheckpoint } from "./reputation-checkpoint.js";

test("MemoryReputationCheckpointStore finds what it saved", () => {
  const store = newMemoryReputationCheckpointStore();
  const item = newReputationCheckpoint("code-64", "title-267");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
