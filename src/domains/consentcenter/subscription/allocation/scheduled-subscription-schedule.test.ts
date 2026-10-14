import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledSubscriptionSchedule } from "./scheduled-subscription-schedule.js";

test("ScheduledSubscriptionSchedule starts in proposed", () => {
  const item = newScheduledSubscriptionSchedule("code-737", "title-415");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledSubscriptionSchedule moves to rejected", () => {
  const item = newScheduledSubscriptionSchedule("code-737", "title-415");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ScheduledSubscriptionSchedule rejects moves from withdrawn", () => {
  const item = newScheduledSubscriptionSchedule("code-737", "title-415");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
