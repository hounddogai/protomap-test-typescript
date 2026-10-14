import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeCheckpointStore } from "./nudge-checkpoint-store.js";
import { newNudgeCheckpoint } from "./nudge-checkpoint.js";

test("MemoryNudgeCheckpointStore finds what it saved", () => {
  const store = newMemoryNudgeCheckpointStore();
  const item = newNudgeCheckpoint("code-734", "name-714");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
