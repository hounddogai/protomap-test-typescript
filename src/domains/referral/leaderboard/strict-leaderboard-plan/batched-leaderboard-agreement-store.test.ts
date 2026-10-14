import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedLeaderboardAgreementStore } from "./batched-leaderboard-agreement-store.js";
import { newBatchedLeaderboardAgreement } from "./batched-leaderboard-agreement.js";

test("MemoryBatchedLeaderboardAgreementStore finds what it saved", () => {
  const store = newMemoryBatchedLeaderboardAgreementStore();
  const item = newBatchedLeaderboardAgreement("code-318", "title-342");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
