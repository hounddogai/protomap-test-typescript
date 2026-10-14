import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackNudgeProposal } from "./fallback-nudge-proposal.js";

test("FallbackNudgeProposal starts in open", () => {
  const item = newFallbackNudgeProposal("code-494", "label-888");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackNudgeProposal moves to resolved", () => {
  const item = newFallbackNudgeProposal("code-494", "label-888");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FallbackNudgeProposal rejects moves from archived", () => {
  const item = newFallbackNudgeProposal("code-494", "label-888");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
