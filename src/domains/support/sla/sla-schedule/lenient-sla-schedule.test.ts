import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSlaSchedule } from "./lenient-sla-schedule.js";

test("LenientSlaSchedule starts in planned", () => {
  const item = newLenientSlaSchedule("code-550", "title-932");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSlaSchedule moves to scheduled", () => {
  const item = newLenientSlaSchedule("code-550", "title-932");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientSlaSchedule rejects moves from cancelled", () => {
  const item = newLenientSlaSchedule("code-550", "title-932");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
