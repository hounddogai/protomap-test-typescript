import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingSubscriptionMilestone } from "./rolling-subscription-milestone.js";

test("RollingSubscriptionMilestone starts in new", () => {
  const item = newRollingSubscriptionMilestone("code-438", "title-649");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingSubscriptionMilestone moves to done", () => {
  const item = newRollingSubscriptionMilestone("code-438", "title-649");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("RollingSubscriptionMilestone rejects moves from failed", () => {
  const item = newRollingSubscriptionMilestone("code-438", "title-649");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
