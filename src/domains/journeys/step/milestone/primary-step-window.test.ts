import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryStepWindow } from "./primary-step-window.js";

test("PrimaryStepWindow starts in idle", () => {
  const item = newPrimaryStepWindow("code-532", "name-370");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryStepWindow moves to ready", () => {
  const item = newPrimaryStepWindow("code-532", "name-370");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PrimaryStepWindow rejects moves from stopped", () => {
  const item = newPrimaryStepWindow("code-532", "name-370");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
