import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationProposal } from "./activation-proposal.js";

test("ActivationProposal starts in open", () => {
  const item = newActivationProposal("code-696", "label-541");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationProposal moves to reopened", () => {
  const item = newActivationProposal("code-696", "label-541");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("ActivationProposal rejects moves from archived", () => {
  const item = newActivationProposal("code-696", "label-541");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
