import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintCheckpointStore } from "./complaint-checkpoint-store.js";
import { newComplaintCheckpoint } from "./complaint-checkpoint.js";

test("MemoryComplaintCheckpointStore finds what it saved", () => {
  const store = newMemoryComplaintCheckpointStore();
  const item = newComplaintCheckpoint("code-367", "name-943");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
