import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedSlaSchedule } from "./capped-sla-schedule.js";

test("CappedSlaSchedule starts in open", () => {
  const item = newCappedSlaSchedule("code-519", "name-600");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedSlaSchedule moves to resolved", () => {
  const item = newCappedSlaSchedule("code-519", "name-600");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CappedSlaSchedule rejects moves from archived", () => {
  const item = newCappedSlaSchedule("code-519", "name-600");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
