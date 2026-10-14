import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackInsightCycle } from "./fallback-insight-cycle.js";

test("FallbackInsightCycle starts in proposed", () => {
  const item = newFallbackInsightCycle("code-813", "label-584");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackInsightCycle moves to rejected", () => {
  const item = newFallbackInsightCycle("code-813", "label-584");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FallbackInsightCycle rejects moves from withdrawn", () => {
  const item = newFallbackInsightCycle("code-813", "label-584");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
