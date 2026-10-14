import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatProposal } from "./csat-proposal.js";

test("CsatProposal starts in draft", () => {
  const item = newCsatProposal("code-325", "label-347");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatProposal moves to active", () => {
  const item = newCsatProposal("code-325", "label-347");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("CsatProposal rejects moves from closed", () => {
  const item = newCsatProposal("code-325", "label-347");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
