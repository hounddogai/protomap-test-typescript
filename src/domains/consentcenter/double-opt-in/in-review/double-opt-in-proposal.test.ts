import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInProposal } from "./double-opt-in-proposal.js";

test("DoubleOptInProposal starts in new", () => {
  const item = newDoubleOptInProposal("code-537", "title-254");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInProposal moves to failed", () => {
  const item = newDoubleOptInProposal("code-537", "title-254");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("DoubleOptInProposal rejects moves from failed", () => {
  const item = newDoubleOptInProposal("code-537", "title-254");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
