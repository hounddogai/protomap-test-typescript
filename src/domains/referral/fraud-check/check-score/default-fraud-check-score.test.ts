import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultFraudCheckScore } from "./default-fraud-check-score.js";

test("DefaultFraudCheckScore starts in draft", () => {
  const item = newDefaultFraudCheckScore("code-2", "label-586");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultFraudCheckScore moves to closed", () => {
  const item = newDefaultFraudCheckScore("code-2", "label-586");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("DefaultFraudCheckScore rejects moves from closed", () => {
  const item = newDefaultFraudCheckScore("code-2", "label-586");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
