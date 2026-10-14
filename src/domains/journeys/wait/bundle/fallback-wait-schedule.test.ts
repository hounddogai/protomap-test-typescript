import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackWaitSchedule } from "./fallback-wait-schedule.js";

test("FallbackWaitSchedule starts in planned", () => {
  const item = newFallbackWaitSchedule("code-371", "name-153");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackWaitSchedule moves to scheduled", () => {
  const item = newFallbackWaitSchedule("code-371", "name-153");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FallbackWaitSchedule rejects moves from cancelled", () => {
  const item = newFallbackWaitSchedule("code-371", "name-153");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
