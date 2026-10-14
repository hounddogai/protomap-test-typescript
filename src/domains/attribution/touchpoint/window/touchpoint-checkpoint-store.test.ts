import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointCheckpointStore } from "./touchpoint-checkpoint-store.js";
import { newTouchpointCheckpoint } from "./touchpoint-checkpoint.js";

test("MemoryTouchpointCheckpointStore finds what it saved", () => {
  const store = newMemoryTouchpointCheckpointStore();
  const item = newTouchpointCheckpoint("code-852", "label-243");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
