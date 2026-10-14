import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalMacroProposal } from "./seasonal-macro-proposal.js";

test("SeasonalMacroProposal starts in created", () => {
  const item = newSeasonalMacroProposal("code-8", "name-462");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalMacroProposal moves to validated", () => {
  const item = newSeasonalMacroProposal("code-8", "name-462");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("SeasonalMacroProposal rejects moves from retired", () => {
  const item = newSeasonalMacroProposal("code-8", "name-462");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
