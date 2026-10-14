import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalApprovalScore } from "./seasonal-approval-score.js";

test("SeasonalApprovalScore starts in proposed", () => {
  const item = newSeasonalApprovalScore("code-812", "name-682");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalApprovalScore moves to withdrawn", () => {
  const item = newSeasonalApprovalScore("code-812", "name-682");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("SeasonalApprovalScore rejects moves from withdrawn", () => {
  const item = newSeasonalApprovalScore("code-812", "name-682");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
