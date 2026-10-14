import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepMapping } from "./step-mapping.js";

test("StepMapping starts in open", () => {
  const item = newStepMapping("code-985", "label-371");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepMapping moves to resolved", () => {
  const item = newStepMapping("code-985", "label-371");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("StepMapping rejects moves from archived", () => {
  const item = newStepMapping("code-985", "label-371");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
