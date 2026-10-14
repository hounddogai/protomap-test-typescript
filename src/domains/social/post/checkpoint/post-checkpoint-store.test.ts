import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostCheckpointStore } from "./post-checkpoint-store.js";
import { newPostCheckpoint } from "./post-checkpoint.js";

test("MemoryPostCheckpointStore finds what it saved", () => {
  const store = newMemoryPostCheckpointStore();
  const item = newPostCheckpoint("code-265", "label-371");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
