import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryExitRuleProposal } from "./primary-exit-rule-proposal.js";

test("PrimaryExitRuleProposal starts in planned", () => {
  const item = newPrimaryExitRuleProposal("code-466", "name-288");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryExitRuleProposal moves to completed", () => {
  const item = newPrimaryExitRuleProposal("code-466", "name-288");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PrimaryExitRuleProposal rejects moves from cancelled", () => {
  const item = newPrimaryExitRuleProposal("code-466", "name-288");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
