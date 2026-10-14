import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPreferenceProposal } from "./primary-preference-proposal.js";

test("PrimaryPreferenceProposal starts in planned", () => {
  const item = newPrimaryPreferenceProposal("code-777", "name-481");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPreferenceProposal moves to completed", () => {
  const item = newPrimaryPreferenceProposal("code-777", "name-481");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PrimaryPreferenceProposal rejects moves from cancelled", () => {
  const item = newPrimaryPreferenceProposal("code-777", "name-481");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
