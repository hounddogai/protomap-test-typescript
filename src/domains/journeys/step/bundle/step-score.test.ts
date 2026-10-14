import assert from "node:assert/strict";
import { test } from "node:test";
import { newStepScore } from "./step-score.js";

test("StepScore starts in requested", () => {
  const item = newStepScore("code-615", "label-864");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StepScore moves to revoked", () => {
  const item = newStepScore("code-615", "label-864");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StepScore rejects moves from expired", () => {
  const item = newStepScore("code-615", "label-864");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
