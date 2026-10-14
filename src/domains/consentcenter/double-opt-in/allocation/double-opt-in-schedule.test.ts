import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInSchedule } from "./double-opt-in-schedule.js";

test("DoubleOptInSchedule starts in planned", () => {
  const item = newDoubleOptInSchedule("code-53", "label-557");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInSchedule moves to scheduled", () => {
  const item = newDoubleOptInSchedule("code-53", "label-557");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("DoubleOptInSchedule rejects moves from cancelled", () => {
  const item = newDoubleOptInSchedule("code-53", "label-557");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
