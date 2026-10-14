import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceProposal } from "./preference-proposal.js";

test("PreferenceProposal starts in draft", () => {
  const item = newPreferenceProposal("code-909", "name-994");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceProposal moves to active", () => {
  const item = newPreferenceProposal("code-909", "name-994");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PreferenceProposal rejects moves from closed", () => {
  const item = newPreferenceProposal("code-909", "name-994");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
