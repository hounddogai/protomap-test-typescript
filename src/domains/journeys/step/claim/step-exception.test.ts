import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepException } from "./step-exception.js";

test("StepException starts in open", () => {
  const item = newStepException("code-747", "label-461");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepException moves to reopened", () => {
  const item = newStepException("code-747", "label-461");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("StepException rejects moves from archived", () => {
  const item = newStepException("code-747", "label-461");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
