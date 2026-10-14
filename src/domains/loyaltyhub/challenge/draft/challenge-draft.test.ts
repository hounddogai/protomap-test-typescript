import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeDraft } from "./challenge-draft.js";

test("ChallengeDraft starts in new", () => {
  const item = newChallengeDraft("code-258", "label-270");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeDraft moves to failed", () => {
  const item = newChallengeDraft("code-258", "label-270");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ChallengeDraft rejects moves from failed", () => {
  const item = newChallengeDraft("code-258", "label-270");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
