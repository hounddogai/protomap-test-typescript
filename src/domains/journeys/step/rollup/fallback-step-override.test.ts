import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackStepOverride } from "./fallback-step-override.js";

test("FallbackStepOverride starts in new", () => {
  const item = newFallbackStepOverride("code-671", "label-83");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackStepOverride moves to running", () => {
  const item = newFallbackStepOverride("code-671", "label-83");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("FallbackStepOverride rejects moves from failed", () => {
  const item = newFallbackStepOverride("code-671", "label-83");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
