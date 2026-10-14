import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedEscalationSchedule } from "./weighted-escalation-schedule.js";

test("WeightedEscalationSchedule starts in proposed", () => {
  const item = newWeightedEscalationSchedule("code-41", "label-633");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedEscalationSchedule moves to approved", () => {
  const item = newWeightedEscalationSchedule("code-41", "label-633");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedEscalationSchedule rejects moves from withdrawn", () => {
  const item = newWeightedEscalationSchedule("code-41", "label-633");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
