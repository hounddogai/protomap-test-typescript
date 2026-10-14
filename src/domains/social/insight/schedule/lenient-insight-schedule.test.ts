import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientInsightSchedule } from "./lenient-insight-schedule.js";

test("LenientInsightSchedule starts in open", () => {
  const item = newLenientInsightSchedule("code-6", "label-822");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientInsightSchedule moves to in review", () => {
  const item = newLenientInsightSchedule("code-6", "label-822");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LenientInsightSchedule rejects moves from archived", () => {
  const item = newLenientInsightSchedule("code-6", "label-822");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
