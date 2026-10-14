import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathCheckpointStore } from "./path-checkpoint-store.js";
import { newPathCheckpoint } from "./path-checkpoint.js";

test("MemoryPathCheckpointStore finds what it saved", () => {
  const store = newMemoryPathCheckpointStore();
  const item = newPathCheckpoint("code-907", "name-31");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
