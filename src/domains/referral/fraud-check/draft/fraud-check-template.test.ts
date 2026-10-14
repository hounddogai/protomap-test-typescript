import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckTemplate } from "./fraud-check-template.js";

test("FraudCheckTemplate starts in idle", () => {
  const item = newFraudCheckTemplate("code-268", "label-682");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckTemplate moves to ready", () => {
  const item = newFraudCheckTemplate("code-268", "label-682");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("FraudCheckTemplate rejects moves from stopped", () => {
  const item = newFraudCheckTemplate("code-268", "label-682");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
