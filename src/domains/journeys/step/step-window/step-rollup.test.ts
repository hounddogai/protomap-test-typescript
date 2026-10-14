import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepRollup } from "./step-rollup.js";

test("StepRollup starts in proposed", () => {
  const item = newStepRollup("code-226", "name-641");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepRollup moves to approved", () => {
  const item = newStepRollup("code-226", "name-641");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("StepRollup rejects moves from withdrawn", () => {
  const item = newStepRollup("code-226", "name-641");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
