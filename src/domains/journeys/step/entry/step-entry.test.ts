import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepEntry } from "./step-entry.js";

test("StepEntry starts in created", () => {
  const item = newStepEntry("code-469", "name-119");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepEntry moves to validated", () => {
  const item = newStepEntry("code-469", "name-119");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("StepEntry rejects moves from retired", () => {
  const item = newStepEntry("code-469", "name-119");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
