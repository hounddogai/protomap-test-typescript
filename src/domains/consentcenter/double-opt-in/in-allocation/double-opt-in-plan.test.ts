import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInPlan } from "./double-opt-in-plan.js";

test("DoubleOptInPlan starts in proposed", () => {
  const item = newDoubleOptInPlan("code-52", "label-665");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInPlan moves to withdrawn", () => {
  const item = newDoubleOptInPlan("code-52", "label-665");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("DoubleOptInPlan rejects moves from withdrawn", () => {
  const item = newDoubleOptInPlan("code-52", "label-665");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
