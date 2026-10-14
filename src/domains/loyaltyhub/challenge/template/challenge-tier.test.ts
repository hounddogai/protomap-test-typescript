import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeTier } from "./challenge-tier.js";

test("ChallengeTier starts in draft", () => {
  const item = newChallengeTier("code-976", "label-897");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeTier moves to active", () => {
  const item = newChallengeTier("code-976", "label-897");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ChallengeTier rejects moves from closed", () => {
  const item = newChallengeTier("code-976", "label-897");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
