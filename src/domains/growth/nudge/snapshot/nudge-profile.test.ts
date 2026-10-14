import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeProfile } from "./nudge-profile.js";

test("NudgeProfile starts in planned", () => {
  const item = newNudgeProfile("code-505", "name-98");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeProfile moves to scheduled", () => {
  const item = newNudgeProfile("code-505", "name-98");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("NudgeProfile rejects moves from cancelled", () => {
  const item = newNudgeProfile("code-505", "name-98");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
