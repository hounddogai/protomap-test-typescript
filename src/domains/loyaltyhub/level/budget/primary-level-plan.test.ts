import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryLevelPlan } from "./primary-level-plan.js";

test("PrimaryLevelPlan starts in draft", () => {
  const item = newPrimaryLevelPlan("code-669", "name-793");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryLevelPlan moves to pending", () => {
  const item = newPrimaryLevelPlan("code-669", "name-793");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PrimaryLevelPlan rejects moves from closed", () => {
  const item = newPrimaryLevelPlan("code-669", "name-793");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
