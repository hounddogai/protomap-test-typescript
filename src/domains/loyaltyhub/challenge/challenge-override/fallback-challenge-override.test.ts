import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackChallengeOverride } from "./fallback-challenge-override.js";

test("FallbackChallengeOverride starts in open", () => {
  const item = newFallbackChallengeOverride("code-317", "name-22");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackChallengeOverride moves to in review", () => {
  const item = newFallbackChallengeOverride("code-317", "name-22");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackChallengeOverride rejects moves from archived", () => {
  const item = newFallbackChallengeOverride("code-317", "name-22");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
