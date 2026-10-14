import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplySchedule } from "./reply-schedule.js";

test("ReplySchedule starts in planned", () => {
  const item = newReplySchedule("code-342", "name-429");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplySchedule moves to scheduled", () => {
  const item = newReplySchedule("code-342", "name-429");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ReplySchedule rejects moves from cancelled", () => {
  const item = newReplySchedule("code-342", "name-429");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
