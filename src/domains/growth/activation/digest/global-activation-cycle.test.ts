import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalActivationCycle } from "./global-activation-cycle.js";

test("GlobalActivationCycle starts in created", () => {
  const item = newGlobalActivationCycle("code-190", "title-850");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalActivationCycle moves to validated", () => {
  const item = newGlobalActivationCycle("code-190", "title-850");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("GlobalActivationCycle rejects moves from retired", () => {
  const item = newGlobalActivationCycle("code-190", "title-850");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
