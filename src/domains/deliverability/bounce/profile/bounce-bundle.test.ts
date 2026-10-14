import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceBundle } from "./bounce-bundle.js";

test("BounceBundle starts in idle", () => {
  const item = newBounceBundle("code-862", "label-297");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceBundle moves to draining", () => {
  const item = newBounceBundle("code-862", "label-297");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("BounceBundle rejects moves from stopped", () => {
  const item = newBounceBundle("code-862", "label-297");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
