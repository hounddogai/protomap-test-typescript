import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledInsightThreshold } from "./scheduled-insight-threshold.js";

test("ScheduledInsightThreshold starts in created", () => {
  const item = newScheduledInsightThreshold("code-145", "name-903");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledInsightThreshold moves to validated", () => {
  const item = newScheduledInsightThreshold("code-145", "name-903");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ScheduledInsightThreshold rejects moves from retired", () => {
  const item = newScheduledInsightThreshold("code-145", "name-903");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
