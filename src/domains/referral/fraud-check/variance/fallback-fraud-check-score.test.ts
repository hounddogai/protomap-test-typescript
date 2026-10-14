import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFraudCheckScore } from "./fallback-fraud-check-score.js";

test("FallbackFraudCheckScore starts in idle", () => {
  const item = newFallbackFraudCheckScore("code-864", "title-482");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFraudCheckScore moves to warming", () => {
  const item = newFallbackFraudCheckScore("code-864", "title-482");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("FallbackFraudCheckScore rejects moves from stopped", () => {
  const item = newFallbackFraudCheckScore("code-864", "title-482");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
