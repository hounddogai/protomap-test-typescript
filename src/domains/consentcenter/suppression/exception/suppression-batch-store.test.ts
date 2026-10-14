import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionBatchStore } from "./suppression-batch-store.js";
import { newSuppressionBatch } from "./suppression-batch.js";

test("MemorySuppressionBatchStore finds what it saved", () => {
  const store = newMemorySuppressionBatchStore();
  const item = newSuppressionBatch("code-967", "title-141");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
