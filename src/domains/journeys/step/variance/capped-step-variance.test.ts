import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedStepVariance } from "./capped-step-variance.js";

test("CappedStepVariance starts in open", () => {
  const item = newCappedStepVariance("code-224", "title-323");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedStepVariance moves to reopened", () => {
  const item = newCappedStepVariance("code-224", "title-323");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("CappedStepVariance rejects moves from archived", () => {
  const item = newCappedStepVariance("code-224", "title-323");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
