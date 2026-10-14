import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledTierProposal } from "./scheduled-tier-proposal.js";

test("ScheduledTierProposal starts in created", () => {
  const item = newScheduledTierProposal("code-10", "label-15");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledTierProposal moves to published", () => {
  const item = newScheduledTierProposal("code-10", "label-15");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ScheduledTierProposal rejects moves from retired", () => {
  const item = newScheduledTierProposal("code-10", "label-15");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
