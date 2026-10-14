import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryFrequencyWindow } from "./primary-frequency-window.js";

test("PrimaryFrequencyWindow starts in open", () => {
  const item = newPrimaryFrequencyWindow("code-839", "name-689");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryFrequencyWindow moves to in review", () => {
  const item = newPrimaryFrequencyWindow("code-839", "name-689");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PrimaryFrequencyWindow rejects moves from archived", () => {
  const item = newPrimaryFrequencyWindow("code-839", "name-689");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
