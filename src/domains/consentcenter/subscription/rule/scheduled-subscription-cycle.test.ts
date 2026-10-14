import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledSubscriptionCycle } from "./scheduled-subscription-cycle.js";

test("ScheduledSubscriptionCycle starts in created", () => {
  const item = newScheduledSubscriptionCycle("code-584", "name-635");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledSubscriptionCycle moves to validated", () => {
  const item = newScheduledSubscriptionCycle("code-584", "name-635");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ScheduledSubscriptionCycle rejects moves from retired", () => {
  const item = newScheduledSubscriptionCycle("code-584", "name-635");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
