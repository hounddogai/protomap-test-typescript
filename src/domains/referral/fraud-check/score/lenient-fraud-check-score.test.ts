import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientFraudCheckScore } from "./lenient-fraud-check-score.js";

test("LenientFraudCheckScore starts in idle", () => {
  const item = newLenientFraudCheckScore("code-126", "label-799");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientFraudCheckScore moves to draining", () => {
  const item = newLenientFraudCheckScore("code-126", "label-799");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LenientFraudCheckScore rejects moves from stopped", () => {
  const item = newLenientFraudCheckScore("code-126", "label-799");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
