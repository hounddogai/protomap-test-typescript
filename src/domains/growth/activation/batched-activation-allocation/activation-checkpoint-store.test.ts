import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationCheckpointStore } from "./activation-checkpoint-store.js";
import { newActivationCheckpoint } from "./activation-checkpoint.js";

test("MemoryActivationCheckpointStore finds what it saved", () => {
  const store = newMemoryActivationCheckpointStore();
  const item = newActivationCheckpoint("code-392", "label-888");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
