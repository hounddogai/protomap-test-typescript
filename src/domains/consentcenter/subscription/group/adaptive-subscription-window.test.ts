import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveSubscriptionWindow } from "./adaptive-subscription-window.js";

test("AdaptiveSubscriptionWindow starts in planned", () => {
  const item = newAdaptiveSubscriptionWindow("code-551", "title-915");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveSubscriptionWindow moves to in progress", () => {
  const item = newAdaptiveSubscriptionWindow("code-551", "title-915");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("AdaptiveSubscriptionWindow rejects moves from cancelled", () => {
  const item = newAdaptiveSubscriptionWindow("code-551", "title-915");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
