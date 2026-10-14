import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutPlan } from "./opt-out-plan.js";

test("OptOutPlan starts in proposed", () => {
  const item = newOptOutPlan("code-805", "name-39");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutPlan moves to approved", () => {
  const item = newOptOutPlan("code-805", "name-39");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("OptOutPlan rejects moves from withdrawn", () => {
  const item = newOptOutPlan("code-805", "name-39");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
