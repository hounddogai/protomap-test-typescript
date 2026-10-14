import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictLeaderboardAgreement } from "./strict-leaderboard-agreement.js";

test("StrictLeaderboardAgreement starts in open", () => {
  const item = newStrictLeaderboardAgreement("code-156", "label-642");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictLeaderboardAgreement moves to resolved", () => {
  const item = newStrictLeaderboardAgreement("code-156", "label-642");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("StrictLeaderboardAgreement rejects moves from archived", () => {
  const item = newStrictLeaderboardAgreement("code-156", "label-642");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
