import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionCheckpointStore } from "./suppression-checkpoint-store.js";
import { newSuppressionCheckpoint } from "./suppression-checkpoint.js";

test("MemorySuppressionCheckpointStore finds what it saved", () => {
  const store = newMemorySuppressionCheckpointStore();
  const item = newSuppressionCheckpoint("code-702", "label-607");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
