import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeBaseline } from "./nudge-baseline.js";

test("NudgeBaseline starts in planned", () => {
  const item = newNudgeBaseline("code-965", "title-988");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeBaseline moves to scheduled", () => {
  const item = newNudgeBaseline("code-965", "title-988");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("NudgeBaseline rejects moves from cancelled", () => {
  const item = newNudgeBaseline("code-965", "title-988");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
