import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingModelBundle } from "./rolling-model-bundle.js";

test("RollingModelBundle starts in new", () => {
  const item = newRollingModelBundle("code-455", "label-161");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingModelBundle moves to queued", () => {
  const item = newRollingModelBundle("code-455", "label-161");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingModelBundle rejects moves from failed", () => {
  const item = newRollingModelBundle("code-455", "label-161");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
