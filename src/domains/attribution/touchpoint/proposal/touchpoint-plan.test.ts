import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointPlan } from "./touchpoint-plan.js";

test("TouchpointPlan starts in draft", () => {
  const item = newTouchpointPlan("code-92", "title-585");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointPlan moves to pending", () => {
  const item = newTouchpointPlan("code-92", "title-585");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("TouchpointPlan rejects moves from closed", () => {
  const item = newTouchpointPlan("code-92", "title-585");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
