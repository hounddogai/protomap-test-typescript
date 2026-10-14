import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledPacingTarget } from "./scheduled-pacing-target.js";

test("ScheduledPacingTarget starts in proposed", () => {
  const item = newScheduledPacingTarget("code-148", "title-782");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledPacingTarget moves to approved", () => {
  const item = newScheduledPacingTarget("code-148", "title-782");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ScheduledPacingTarget rejects moves from withdrawn", () => {
  const item = newScheduledPacingTarget("code-148", "title-782");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
