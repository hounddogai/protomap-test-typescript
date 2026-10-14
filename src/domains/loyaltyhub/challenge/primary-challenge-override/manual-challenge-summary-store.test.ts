import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualChallengeSummaryStore } from "./manual-challenge-summary-store.js";
import { newManualChallengeSummary } from "./manual-challenge-summary.js";

test("MemoryManualChallengeSummaryStore finds what it saved", () => {
  const store = newMemoryManualChallengeSummaryStore();
  const item = newManualChallengeSummary("code-766", "name-329");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
