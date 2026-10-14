import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepRecord } from "./step-record.js";

test("StepRecord starts in idle", () => {
  const item = newStepRecord("code-227", "name-940");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepRecord moves to warming", () => {
  const item = newStepRecord("code-227", "name-940");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("StepRecord rejects moves from stopped", () => {
  const item = newStepRecord("code-227", "name-940");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
