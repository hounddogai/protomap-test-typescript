import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientNudgeProposal } from "./lenient-nudge-proposal.js";

test("LenientNudgeProposal starts in open", () => {
  const item = newLenientNudgeProposal("code-837", "name-42");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientNudgeProposal moves to archived", () => {
  const item = newLenientNudgeProposal("code-837", "name-42");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("LenientNudgeProposal rejects moves from archived", () => {
  const item = newLenientNudgeProposal("code-837", "name-42");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
