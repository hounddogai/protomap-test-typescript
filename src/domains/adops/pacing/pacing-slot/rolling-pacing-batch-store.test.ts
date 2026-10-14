import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPacingBatchStore } from "./rolling-pacing-batch-store.js";
import { newRollingPacingBatch } from "./rolling-pacing-batch.js";

test("MemoryRollingPacingBatchStore finds what it saved", () => {
  const store = newMemoryRollingPacingBatchStore();
  const item = newRollingPacingBatch("code-716", "name-67");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
