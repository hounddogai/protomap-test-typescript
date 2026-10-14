import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedNudgeSummaryStore } from "./batched-nudge-summary-store.js";
import { newBatchedNudgeSummary } from "./batched-nudge-summary.js";

test("MemoryBatchedNudgeSummaryStore finds what it saved", () => {
  const store = newMemoryBatchedNudgeSummaryStore();
  const item = newBatchedNudgeSummary("code-513", "label-522");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
