import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledPacingBaseline } from "./scheduled-pacing-baseline.js";

test("ScheduledPacingBaseline starts in proposed", () => {
  const item = newScheduledPacingBaseline("code-205", "label-38");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledPacingBaseline moves to approved", () => {
  const item = newScheduledPacingBaseline("code-205", "label-38");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ScheduledPacingBaseline rejects moves from withdrawn", () => {
  const item = newScheduledPacingBaseline("code-205", "label-38");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
