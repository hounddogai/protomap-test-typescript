import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepRequest } from "./step-request.js";

test("StepRequest starts in open", () => {
  const item = newStepRequest("code-270", "label-250");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepRequest moves to resolved", () => {
  const item = newStepRequest("code-270", "label-250");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("StepRequest rejects moves from archived", () => {
  const item = newStepRequest("code-270", "label-250");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
