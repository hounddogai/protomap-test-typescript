import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceSummary } from "./bounce-summary.js";

test("BounceSummary starts in idle", () => {
  const item = newBounceSummary("code-791", "label-22");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceSummary moves to stopped", () => {
  const item = newBounceSummary("code-791", "label-22");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("BounceSummary rejects moves from stopped", () => {
  const item = newBounceSummary("code-791", "label-22");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
