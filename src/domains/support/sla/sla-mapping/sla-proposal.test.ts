import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaProposal } from "./sla-proposal.js";

test("SlaProposal starts in requested", () => {
  const item = newSlaProposal("code-440", "name-119");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaProposal moves to expired", () => {
  const item = newSlaProposal("code-440", "name-119");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("SlaProposal rejects moves from expired", () => {
  const item = newSlaProposal("code-440", "name-119");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
