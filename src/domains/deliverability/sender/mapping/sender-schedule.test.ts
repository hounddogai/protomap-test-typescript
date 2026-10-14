import assert from "node:assert/strict";
import { test } from "node:test";
import { newSenderSchedule } from "./sender-schedule.js";

test("SenderSchedule starts in open", () => {
  const item = newSenderSchedule("code-791", "name-421");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SenderSchedule moves to in review", () => {
  const item = newSenderSchedule("code-791", "name-421");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SenderSchedule rejects moves from archived", () => {
  const item = newSenderSchedule("code-791", "name-421");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
