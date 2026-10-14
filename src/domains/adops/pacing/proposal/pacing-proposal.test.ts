import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingProposal } from "./pacing-proposal.js";

test("PacingProposal starts in planned", () => {
  const item = newPacingProposal("code-294", "label-193");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingProposal moves to in progress", () => {
  const item = newPacingProposal("code-294", "label-193");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("PacingProposal rejects moves from cancelled", () => {
  const item = newPacingProposal("code-294", "label-193");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
