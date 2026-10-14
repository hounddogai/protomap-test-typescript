import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationPlan } from "./activation-plan.js";

test("ActivationPlan starts in draft", () => {
  const item = newActivationPlan("code-42", "name-303");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationPlan moves to closed", () => {
  const item = newActivationPlan("code-42", "name-303");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("ActivationPlan rejects moves from closed", () => {
  const item = newActivationPlan("code-42", "name-303");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
