import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowProposal } from "./window-proposal.js";

test("WindowProposal starts in draft", () => {
  const item = newWindowProposal("code-511", "title-250");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowProposal moves to suspended", () => {
  const item = newWindowProposal("code-511", "title-250");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("WindowProposal rejects moves from closed", () => {
  const item = newWindowProposal("code-511", "title-250");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
