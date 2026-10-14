import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInCheckpointStore } from "./double-opt-in-checkpoint-store.js";
import { newDoubleOptInCheckpoint } from "./double-opt-in-checkpoint.js";

test("MemoryDoubleOptInCheckpointStore finds what it saved", () => {
  const store = newMemoryDoubleOptInCheckpointStore();
  const item = newDoubleOptInCheckpoint("code-317", "title-928");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
