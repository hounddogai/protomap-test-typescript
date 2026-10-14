import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalEscalationMetric } from "./seasonal-escalation-metric.js";

test("SeasonalEscalationMetric starts in draft", () => {
  const item = newSeasonalEscalationMetric("code-156", "label-848");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalEscalationMetric moves to suspended", () => {
  const item = newSeasonalEscalationMetric("code-156", "label-848");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("SeasonalEscalationMetric rejects moves from closed", () => {
  const item = newSeasonalEscalationMetric("code-156", "label-848");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
