import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationBaseline } from "./activation-baseline.js";

test("ActivationBaseline starts in idle", () => {
  const item = newActivationBaseline("code-548", "label-315");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationBaseline moves to stopped", () => {
  const item = newActivationBaseline("code-548", "label-315");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("ActivationBaseline rejects moves from stopped", () => {
  const item = newActivationBaseline("code-548", "label-315");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
