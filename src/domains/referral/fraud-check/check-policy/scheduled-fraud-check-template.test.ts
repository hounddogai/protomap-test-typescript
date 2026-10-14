import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFraudCheckTemplate } from "./scheduled-fraud-check-template.js";

test("ScheduledFraudCheckTemplate starts in idle", () => {
  const item = newScheduledFraudCheckTemplate("code-689", "title-393");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFraudCheckTemplate moves to stopped", () => {
  const item = newScheduledFraudCheckTemplate("code-689", "title-393");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("ScheduledFraudCheckTemplate rejects moves from stopped", () => {
  const item = newScheduledFraudCheckTemplate("code-689", "title-393");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
