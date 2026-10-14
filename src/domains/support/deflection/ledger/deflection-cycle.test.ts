import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionCycle } from "./deflection-cycle.js";

test("DeflectionCycle starts in idle", () => {
  const item = newDeflectionCycle("code-481", "label-858");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionCycle moves to ready", () => {
  const item = newDeflectionCycle("code-481", "label-858");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("DeflectionCycle rejects moves from stopped", () => {
  const item = newDeflectionCycle("code-481", "label-858");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
