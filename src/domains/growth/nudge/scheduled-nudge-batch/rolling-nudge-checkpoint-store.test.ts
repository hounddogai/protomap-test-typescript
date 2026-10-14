import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingNudgeCheckpointStore } from "./rolling-nudge-checkpoint-store.js";
import { newRollingNudgeCheckpoint } from "./rolling-nudge-checkpoint.js";

test("MemoryRollingNudgeCheckpointStore finds what it saved", () => {
  const store = newMemoryRollingNudgeCheckpointStore();
  const item = newRollingNudgeCheckpoint("code-813", "name-830");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
