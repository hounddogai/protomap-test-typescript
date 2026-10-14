import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepVariance } from "./step-variance.js";

test("StepVariance starts in requested", () => {
  const item = newStepVariance("code-703", "name-371");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepVariance moves to granted", () => {
  const item = newStepVariance("code-703", "name-371");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StepVariance rejects moves from expired", () => {
  const item = newStepVariance("code-703", "name-371");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
