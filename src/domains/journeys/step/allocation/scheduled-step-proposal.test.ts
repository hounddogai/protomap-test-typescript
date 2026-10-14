import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledStepProposal } from "./scheduled-step-proposal.js";

test("ScheduledStepProposal starts in planned", () => {
  const item = newScheduledStepProposal("code-753", "title-787");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledStepProposal moves to scheduled", () => {
  const item = newScheduledStepProposal("code-753", "title-787");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ScheduledStepProposal rejects moves from cancelled", () => {
  const item = newScheduledStepProposal("code-753", "title-787");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
