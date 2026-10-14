import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackNudgeSummary } from "./fallback-nudge-summary.js";

test("FallbackNudgeSummary starts in open", () => {
  const item = newFallbackNudgeSummary("code-642", "label-624");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackNudgeSummary moves to in review", () => {
  const item = newFallbackNudgeSummary("code-642", "label-624");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackNudgeSummary rejects moves from archived", () => {
  const item = newFallbackNudgeSummary("code-642", "label-624");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
