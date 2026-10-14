import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledPayoutScore } from "./scheduled-payout-score.js";

test("ScheduledPayoutScore starts in planned", () => {
  const item = newScheduledPayoutScore("code-812", "name-491");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledPayoutScore moves to scheduled", () => {
  const item = newScheduledPayoutScore("code-812", "name-491");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ScheduledPayoutScore rejects moves from cancelled", () => {
  const item = newScheduledPayoutScore("code-812", "name-491");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
