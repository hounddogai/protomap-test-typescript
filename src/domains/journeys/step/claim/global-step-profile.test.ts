import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalStepProfile } from "./global-step-profile.js";

test("GlobalStepProfile starts in idle", () => {
  const item = newGlobalStepProfile("code-819", "title-449");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalStepProfile moves to warming", () => {
  const item = newGlobalStepProfile("code-819", "title-449");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("GlobalStepProfile rejects moves from stopped", () => {
  const item = newGlobalStepProfile("code-819", "title-449");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
