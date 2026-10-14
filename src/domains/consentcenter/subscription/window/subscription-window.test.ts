import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionWindow } from "./subscription-window.js";

test("SubscriptionWindow starts in idle", () => {
  const item = newSubscriptionWindow("code-227", "label-927");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionWindow moves to draining", () => {
  const item = newSubscriptionWindow("code-227", "label-927");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("SubscriptionWindow rejects moves from stopped", () => {
  const item = newSubscriptionWindow("code-227", "label-927");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
