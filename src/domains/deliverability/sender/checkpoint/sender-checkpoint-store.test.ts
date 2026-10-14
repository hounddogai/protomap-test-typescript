import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderCheckpointStore } from "./sender-checkpoint-store.js";
import { newSenderCheckpoint } from "./sender-checkpoint.js";

test("MemorySenderCheckpointStore finds what it saved", () => {
  const store = newMemorySenderCheckpointStore();
  const item = newSenderCheckpoint("code-342", "name-926");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
