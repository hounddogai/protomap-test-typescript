import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualLeaderboardDraft } from "./manual-leaderboard-draft.js";

test("ManualLeaderboardDraft starts in proposed", () => {
  const item = newManualLeaderboardDraft("code-478", "title-721");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualLeaderboardDraft moves to rejected", () => {
  const item = newManualLeaderboardDraft("code-478", "title-721");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ManualLeaderboardDraft rejects moves from withdrawn", () => {
  const item = newManualLeaderboardDraft("code-478", "title-721");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
