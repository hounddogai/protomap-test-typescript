import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedChallengeSummaryStore } from "./batched-challenge-summary-store.js";
import { newBatchedChallengeSummary } from "./batched-challenge-summary.js";

test("MemoryBatchedChallengeSummaryStore finds what it saved", () => {
  const store = newMemoryBatchedChallengeSummaryStore();
  const item = newBatchedChallengeSummary("code-32", "title-793");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
