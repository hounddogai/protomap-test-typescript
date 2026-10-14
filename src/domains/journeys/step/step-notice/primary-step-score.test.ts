import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryStepScore } from "./primary-step-score.js";

test("PrimaryStepScore starts in open", () => {
  const item = newPrimaryStepScore("code-351", "label-318");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryStepScore moves to resolved", () => {
  const item = newPrimaryStepScore("code-351", "label-318");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PrimaryStepScore rejects moves from archived", () => {
  const item = newPrimaryStepScore("code-351", "label-318");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
