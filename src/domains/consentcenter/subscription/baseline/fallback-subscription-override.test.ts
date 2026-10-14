import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSubscriptionOverride } from "./fallback-subscription-override.js";

test("FallbackSubscriptionOverride starts in idle", () => {
  const item = newFallbackSubscriptionOverride("code-752", "title-119");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSubscriptionOverride moves to ready", () => {
  const item = newFallbackSubscriptionOverride("code-752", "title-119");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FallbackSubscriptionOverride rejects moves from stopped", () => {
  const item = newFallbackSubscriptionOverride("code-752", "title-119");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
