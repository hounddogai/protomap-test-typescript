import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredSubscriptionSchedule } from "./tiered-subscription-schedule.js";

test("TieredSubscriptionSchedule starts in planned", () => {
  const item = newTieredSubscriptionSchedule("code-993", "label-136");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredSubscriptionSchedule moves to scheduled", () => {
  const item = newTieredSubscriptionSchedule("code-993", "label-136");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TieredSubscriptionSchedule rejects moves from cancelled", () => {
  const item = newTieredSubscriptionSchedule("code-993", "label-136");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
