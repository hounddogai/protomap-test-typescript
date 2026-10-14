import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutSchedule } from "./opt-out-schedule.js";

test("OptOutSchedule starts in proposed", () => {
  const item = newOptOutSchedule("code-892", "title-437");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutSchedule moves to approved", () => {
  const item = newOptOutSchedule("code-892", "title-437");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("OptOutSchedule rejects moves from withdrawn", () => {
  const item = newOptOutSchedule("code-892", "title-437");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
