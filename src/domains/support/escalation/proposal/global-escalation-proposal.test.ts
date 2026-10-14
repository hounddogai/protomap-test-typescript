import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalEscalationProposal } from "./global-escalation-proposal.js";

test("GlobalEscalationProposal starts in requested", () => {
  const item = newGlobalEscalationProposal("code-231", "title-341");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalEscalationProposal moves to granted", () => {
  const item = newGlobalEscalationProposal("code-231", "title-341");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("GlobalEscalationProposal rejects moves from expired", () => {
  const item = newGlobalEscalationProposal("code-231", "title-341");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
