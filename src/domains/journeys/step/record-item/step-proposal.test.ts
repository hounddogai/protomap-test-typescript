import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepProposal } from "./step-proposal.js";

test("StepProposal starts in draft", () => {
  const item = newStepProposal("code-642", "title-592");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepProposal moves to suspended", () => {
  const item = newStepProposal("code-642", "title-592");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("StepProposal rejects moves from closed", () => {
  const item = newStepProposal("code-642", "title-592");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
