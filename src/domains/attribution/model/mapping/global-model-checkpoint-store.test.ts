import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalModelCheckpointStore } from "./global-model-checkpoint-store.js";
import { newGlobalModelCheckpoint } from "./global-model-checkpoint.js";

test("MemoryGlobalModelCheckpointStore finds what it saved", () => {
  const store = newMemoryGlobalModelCheckpointStore();
  const item = newGlobalModelCheckpoint("code-898", "name-146");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
