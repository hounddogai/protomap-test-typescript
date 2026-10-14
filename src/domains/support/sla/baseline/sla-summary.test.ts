import assert from "node:assert/strict";
import { test } from "node:test";
import { newSlaSummary } from "./sla-summary.js";

test("SlaSummary starts in idle", () => {
  const item = newSlaSummary("code-863", "label-200");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SlaSummary moves to ready", () => {
  const item = newSlaSummary("code-863", "label-200");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SlaSummary rejects moves from stopped", () => {
  const item = newSlaSummary("code-863", "label-200");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
