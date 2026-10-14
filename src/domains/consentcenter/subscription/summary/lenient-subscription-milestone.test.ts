import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSubscriptionMilestone } from "./lenient-subscription-milestone.js";

test("LenientSubscriptionMilestone starts in new", () => {
  const item = newLenientSubscriptionMilestone("code-854", "title-220");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSubscriptionMilestone moves to running", () => {
  const item = newLenientSubscriptionMilestone("code-854", "title-220");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LenientSubscriptionMilestone rejects moves from failed", () => {
  const item = newLenientSubscriptionMilestone("code-854", "title-220");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
