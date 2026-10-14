import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepTemplate } from "./step-template.js";

test("StepTemplate starts in planned", () => {
  const item = newStepTemplate("code-744", "name-513");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepTemplate moves to scheduled", () => {
  const item = newStepTemplate("code-744", "name-513");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("StepTemplate rejects moves from cancelled", () => {
  const item = newStepTemplate("code-744", "name-513");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
