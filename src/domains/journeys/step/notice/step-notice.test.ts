import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepNotice } from "./step-notice.js";

test("StepNotice starts in planned", () => {
  const item = newStepNotice("code-137", "name-166");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepNotice moves to scheduled", () => {
  const item = newStepNotice("code-137", "name-166");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("StepNotice rejects moves from cancelled", () => {
  const item = newStepNotice("code-137", "name-166");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
