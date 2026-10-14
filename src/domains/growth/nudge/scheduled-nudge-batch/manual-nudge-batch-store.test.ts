import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualNudgeBatchStore } from "./manual-nudge-batch-store.js";
import { newManualNudgeBatch } from "./manual-nudge-batch.js";

test("MemoryManualNudgeBatchStore finds what it saved", () => {
  const store = newMemoryManualNudgeBatchStore();
  const item = newManualNudgeBatch("code-240", "label-980");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
