import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepBaseline } from "./step-baseline.js";

test("StepBaseline starts in proposed", () => {
  const item = newStepBaseline("code-360", "title-359");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepBaseline moves to approved", () => {
  const item = newStepBaseline("code-360", "title-359");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("StepBaseline rejects moves from withdrawn", () => {
  const item = newStepBaseline("code-360", "title-359");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
