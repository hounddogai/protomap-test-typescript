import assert from "node:assert/strict";
import { test } from "node:test";
import { newSubscriptionSchedule } from "./subscription-schedule.js";

test("SubscriptionSchedule starts in planned", () => {
  const item = newSubscriptionSchedule("code-128", "title-874");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SubscriptionSchedule moves to cancelled", () => {
  const item = newSubscriptionSchedule("code-128", "title-874");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("SubscriptionSchedule rejects moves from cancelled", () => {
  const item = newSubscriptionSchedule("code-128", "title-874");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
