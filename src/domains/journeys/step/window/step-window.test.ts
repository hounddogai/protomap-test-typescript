import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepWindow } from "./step-window.js";

test("StepWindow starts in idle", () => {
  const item = newStepWindow("code-125", "title-659");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepWindow moves to warming", () => {
  const item = newStepWindow("code-125", "title-659");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("StepWindow rejects moves from stopped", () => {
  const item = newStepWindow("code-125", "title-659");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
