import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultEscalationSchedule } from "./default-escalation-schedule.js";

test("DefaultEscalationSchedule starts in new", () => {
  const item = newDefaultEscalationSchedule("code-542", "title-629");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultEscalationSchedule moves to done", () => {
  const item = newDefaultEscalationSchedule("code-542", "title-629");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("DefaultEscalationSchedule rejects moves from failed", () => {
  const item = newDefaultEscalationSchedule("code-542", "title-629");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
