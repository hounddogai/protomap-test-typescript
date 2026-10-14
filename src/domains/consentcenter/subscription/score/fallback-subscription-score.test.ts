import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSubscriptionScore } from "./fallback-subscription-score.js";

test("FallbackSubscriptionScore starts in new", () => {
  const item = newFallbackSubscriptionScore("code-301", "label-21");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSubscriptionScore moves to queued", () => {
  const item = newFallbackSubscriptionScore("code-301", "label-21");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackSubscriptionScore rejects moves from failed", () => {
  const item = newFallbackSubscriptionScore("code-301", "label-21");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
