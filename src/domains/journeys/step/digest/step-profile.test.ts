import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepProfile } from "./step-profile.js";

test("StepProfile starts in proposed", () => {
  const item = newStepProfile("code-565", "label-927");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepProfile moves to withdrawn", () => {
  const item = newStepProfile("code-565", "label-927");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("StepProfile rejects moves from withdrawn", () => {
  const item = newStepProfile("code-565", "label-927");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
