import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveStreakClaim } from "./adaptive-streak-claim.js";

test("AdaptiveStreakClaim starts in draft", () => {
  const item = newAdaptiveStreakClaim("code-401", "label-317");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveStreakClaim moves to pending", () => {
  const item = newAdaptiveStreakClaim("code-401", "label-317");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("AdaptiveStreakClaim rejects moves from closed", () => {
  const item = newAdaptiveStreakClaim("code-401", "label-317");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
