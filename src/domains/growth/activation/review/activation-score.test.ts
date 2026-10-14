import assert from "node:assert/strict";
import { test } from "node:test";
import { newActivationScore } from "./activation-score.js";

test("ActivationScore starts in open", () => {
  const item = newActivationScore("code-913", "label-343");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ActivationScore moves to in review", () => {
  const item = newActivationScore("code-913", "label-343");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ActivationScore rejects moves from archived", () => {
  const item = newActivationScore("code-913", "label-343");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
