import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultSubscriptionCycle } from "./default-subscription-cycle.js";

test("DefaultSubscriptionCycle starts in idle", () => {
  const item = newDefaultSubscriptionCycle("code-943", "label-591");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultSubscriptionCycle moves to draining", () => {
  const item = newDefaultSubscriptionCycle("code-943", "label-591");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("DefaultSubscriptionCycle rejects moves from stopped", () => {
  const item = newDefaultSubscriptionCycle("code-943", "label-591");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
