import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitSchedule } from "./wait-schedule.js";

test("WaitSchedule starts in open", () => {
  const item = newWaitSchedule("code-697", "name-205");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitSchedule moves to in review", () => {
  const item = newWaitSchedule("code-697", "name-205");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WaitSchedule rejects moves from archived", () => {
  const item = newWaitSchedule("code-697", "name-205");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
