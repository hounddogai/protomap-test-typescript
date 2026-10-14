import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleProposal } from "./exit-rule-proposal.js";

test("ExitRuleProposal starts in proposed", () => {
  const item = newExitRuleProposal("code-123", "name-544");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleProposal moves to approved", () => {
  const item = newExitRuleProposal("code-123", "name-544");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ExitRuleProposal rejects moves from withdrawn", () => {
  const item = newExitRuleProposal("code-123", "name-544");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
