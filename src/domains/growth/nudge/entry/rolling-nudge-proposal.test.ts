import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingNudgeProposal } from "./rolling-nudge-proposal.js";

test("RollingNudgeProposal starts in created", () => {
  const item = newRollingNudgeProposal("code-737", "title-869");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingNudgeProposal moves to published", () => {
  const item = newRollingNudgeProposal("code-737", "title-869");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RollingNudgeProposal rejects moves from retired", () => {
  const item = newRollingNudgeProposal("code-737", "title-869");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
