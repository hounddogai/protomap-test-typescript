import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowPlan } from "./window-plan.js";

test("WindowPlan starts in created", () => {
  const item = newWindowPlan("code-112", "label-928");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowPlan moves to published", () => {
  const item = newWindowPlan("code-112", "label-928");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WindowPlan rejects moves from retired", () => {
  const item = newWindowPlan("code-112", "label-928");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
