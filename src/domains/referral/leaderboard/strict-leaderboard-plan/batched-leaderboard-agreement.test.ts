import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedLeaderboardAgreement } from "./batched-leaderboard-agreement.js";

test("BatchedLeaderboardAgreement starts in planned", () => {
  const item = newBatchedLeaderboardAgreement("code-318", "title-342");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedLeaderboardAgreement moves to scheduled", () => {
  const item = newBatchedLeaderboardAgreement("code-318", "title-342");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BatchedLeaderboardAgreement rejects moves from cancelled", () => {
  const item = newBatchedLeaderboardAgreement("code-318", "title-342");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
