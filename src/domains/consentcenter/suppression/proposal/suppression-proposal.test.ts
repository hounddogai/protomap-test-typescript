import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionProposal } from "./suppression-proposal.js";

test("SuppressionProposal starts in new", () => {
  const item = newSuppressionProposal("code-861", "name-239");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionProposal moves to done", () => {
  const item = newSuppressionProposal("code-861", "name-239");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("SuppressionProposal rejects moves from failed", () => {
  const item = newSuppressionProposal("code-861", "name-239");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
