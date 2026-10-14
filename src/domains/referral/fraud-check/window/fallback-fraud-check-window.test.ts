import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFraudCheckWindow } from "./fallback-fraud-check-window.js";

test("FallbackFraudCheckWindow starts in idle", () => {
  const item = newFallbackFraudCheckWindow("code-199", "name-177");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFraudCheckWindow moves to draining", () => {
  const item = newFallbackFraudCheckWindow("code-199", "name-177");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("FallbackFraudCheckWindow rejects moves from stopped", () => {
  const item = newFallbackFraudCheckWindow("code-199", "name-177");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
