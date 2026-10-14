import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeSlot } from "./nudge-slot.js";

test("NudgeSlot starts in planned", () => {
  const item = newNudgeSlot("code-101", "name-257");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeSlot moves to scheduled", () => {
  const item = newNudgeSlot("code-101", "name-257");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("NudgeSlot rejects moves from cancelled", () => {
  const item = newNudgeSlot("code-101", "name-257");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
