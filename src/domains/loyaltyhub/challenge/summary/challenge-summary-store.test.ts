import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeSummaryStore } from "./challenge-summary-store.js";
import { newChallengeSummary } from "./challenge-summary.js";

test("MemoryChallengeSummaryStore finds what it saved", () => {
  const store = newMemoryChallengeSummaryStore();
  const item = newChallengeSummary("code-561", "title-959");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
