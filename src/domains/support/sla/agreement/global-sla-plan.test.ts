import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalSlaPlan } from "./global-sla-plan.js";

test("GlobalSlaPlan starts in idle", () => {
  const item = newGlobalSlaPlan("code-207", "label-614");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalSlaPlan moves to ready", () => {
  const item = newGlobalSlaPlan("code-207", "label-614");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("GlobalSlaPlan rejects moves from stopped", () => {
  const item = newGlobalSlaPlan("code-207", "label-614");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
