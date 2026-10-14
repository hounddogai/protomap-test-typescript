import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepBundle } from "./step-bundle.js";

test("StepBundle starts in draft", () => {
  const item = newStepBundle("code-431", "title-583");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepBundle moves to pending", () => {
  const item = newStepBundle("code-431", "title-583");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("StepBundle rejects moves from closed", () => {
  const item = newStepBundle("code-431", "title-583");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
