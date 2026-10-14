import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFrequencyPlan } from "./scheduled-frequency-plan.js";

test("ScheduledFrequencyPlan starts in open", () => {
  const item = newScheduledFrequencyPlan("code-641", "title-420");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFrequencyPlan moves to in review", () => {
  const item = newScheduledFrequencyPlan("code-641", "title-420");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ScheduledFrequencyPlan rejects moves from archived", () => {
  const item = newScheduledFrequencyPlan("code-641", "title-420");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
