import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyExitRuleProposal } from "./legacy-exit-rule-proposal.js";

test("LegacyExitRuleProposal starts in idle", () => {
  const item = newLegacyExitRuleProposal("code-734", "title-175");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyExitRuleProposal moves to warming", () => {
  const item = newLegacyExitRuleProposal("code-734", "title-175");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LegacyExitRuleProposal rejects moves from stopped", () => {
  const item = newLegacyExitRuleProposal("code-734", "title-175");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
