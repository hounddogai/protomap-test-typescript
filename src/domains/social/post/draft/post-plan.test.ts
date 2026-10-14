import assert from "node:assert/strict";
import { test } from "node:test";
import { newPostPlan } from "./post-plan.js";

test("PostPlan starts in planned", () => {
  const item = newPostPlan("code-33", "label-441");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PostPlan moves to cancelled", () => {
  const item = newPostPlan("code-33", "label-441");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("PostPlan rejects moves from cancelled", () => {
  const item = newPostPlan("code-33", "label-441");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
