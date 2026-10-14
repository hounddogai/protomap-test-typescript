import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictStepProposal } from "./strict-step-proposal.js";

test("StrictStepProposal starts in requested", () => {
  const item = newStrictStepProposal("code-952", "title-324");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictStepProposal moves to granted", () => {
  const item = newStrictStepProposal("code-952", "title-324");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictStepProposal rejects moves from expired", () => {
  const item = newStrictStepProposal("code-952", "title-324");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
