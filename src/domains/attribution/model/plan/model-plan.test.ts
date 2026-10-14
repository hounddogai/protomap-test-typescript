import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelPlan } from "./model-plan.js";

test("ModelPlan starts in proposed", () => {
  const item = newModelPlan("code-409", "title-51");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelPlan moves to approved", () => {
  const item = newModelPlan("code-409", "title-51");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ModelPlan rejects moves from withdrawn", () => {
  const item = newModelPlan("code-409", "title-51");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
