import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepCheckpointStore } from "./step-checkpoint-store.js";
import { newStepCheckpoint } from "./step-checkpoint.js";

test("MemoryStepCheckpointStore finds what it saved", () => {
  const store = newMemoryStepCheckpointStore();
  const item = newStepCheckpoint("code-501", "label-24");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
