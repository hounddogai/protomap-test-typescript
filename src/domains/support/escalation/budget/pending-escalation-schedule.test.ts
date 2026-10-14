import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingEscalationSchedule } from "./pending-escalation-schedule.js";

test("PendingEscalationSchedule starts in proposed", () => {
  const item = newPendingEscalationSchedule("code-978", "name-908");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingEscalationSchedule moves to approved", () => {
  const item = newPendingEscalationSchedule("code-978", "name-908");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PendingEscalationSchedule rejects moves from withdrawn", () => {
  const item = newPendingEscalationSchedule("code-978", "name-908");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
