import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingStepPolicy } from "./rolling-step-policy.js";

test("RollingStepPolicy starts in new", () => {
  const item = newRollingStepPolicy("code-207", "label-316");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingStepPolicy moves to queued", () => {
  const item = newRollingStepPolicy("code-207", "label-316");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingStepPolicy rejects moves from failed", () => {
  const item = newRollingStepPolicy("code-207", "label-316");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
