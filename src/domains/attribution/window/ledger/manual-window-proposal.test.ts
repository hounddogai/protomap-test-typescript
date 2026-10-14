import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualWindowProposal } from "./manual-window-proposal.js";

test("ManualWindowProposal starts in draft", () => {
  const item = newManualWindowProposal("code-127", "label-34");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualWindowProposal moves to suspended", () => {
  const item = newManualWindowProposal("code-127", "label-34");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ManualWindowProposal rejects moves from closed", () => {
  const item = newManualWindowProposal("code-127", "label-34");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
