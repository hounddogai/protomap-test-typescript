import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredChallengeSummaryStore } from "./tiered-challenge-summary-store.js";
import { newTieredChallengeSummary } from "./tiered-challenge-summary.js";

test("MemoryTieredChallengeSummaryStore finds what it saved", () => {
  const store = newMemoryTieredChallengeSummaryStore();
  const item = newTieredChallengeSummary("code-762", "label-577");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
