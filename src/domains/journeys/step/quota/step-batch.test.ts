import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepBatch } from "./step-batch.js";

test("StepBatch starts in draft", () => {
  const item = newStepBatch("code-418", "name-634");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepBatch moves to suspended", () => {
  const item = newStepBatch("code-418", "name-634");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("StepBatch rejects moves from closed", () => {
  const item = newStepBatch("code-418", "name-634");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
