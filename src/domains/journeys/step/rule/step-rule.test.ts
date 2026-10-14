import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepRule } from "./step-rule.js";

test("StepRule starts in created", () => {
  const item = newStepRule("code-588", "title-546");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepRule moves to validated", () => {
  const item = newStepRule("code-588", "title-546");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("StepRule rejects moves from retired", () => {
  const item = newStepRule("code-588", "title-546");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
