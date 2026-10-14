import assert from "node:assert/strict";
import { test } from "node:test";
import { newQueueSchedule } from "./queue-schedule.js";

test("QueueSchedule starts in planned", () => {
  const item = newQueueSchedule("code-440", "title-414");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("QueueSchedule moves to scheduled", () => {
  const item = newQueueSchedule("code-440", "title-414");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("QueueSchedule rejects moves from cancelled", () => {
  const item = newQueueSchedule("code-440", "title-414");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
