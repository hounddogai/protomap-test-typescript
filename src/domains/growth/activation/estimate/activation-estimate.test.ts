import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationEstimate } from "./activation-estimate.js";

test("ActivationEstimate starts in idle", () => {
  const item = newActivationEstimate("code-894", "name-590");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationEstimate moves to warming", () => {
  const item = newActivationEstimate("code-894", "name-590");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ActivationEstimate rejects moves from stopped", () => {
  const item = newActivationEstimate("code-894", "name-590");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
