import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalStreakProposal } from "./regional-streak-proposal.js";

test("RegionalStreakProposal starts in requested", () => {
  const item = newRegionalStreakProposal("code-29", "label-354");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalStreakProposal moves to revoked", () => {
  const item = newRegionalStreakProposal("code-29", "label-354");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RegionalStreakProposal rejects moves from expired", () => {
  const item = newRegionalStreakProposal("code-29", "label-354");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
