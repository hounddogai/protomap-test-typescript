import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalLevelProposal } from "./seasonal-level-proposal.js";

test("SeasonalLevelProposal starts in planned", () => {
  const item = newSeasonalLevelProposal("code-234", "title-655");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalLevelProposal moves to scheduled", () => {
  const item = newSeasonalLevelProposal("code-234", "title-655");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SeasonalLevelProposal rejects moves from cancelled", () => {
  const item = newSeasonalLevelProposal("code-234", "title-655");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
