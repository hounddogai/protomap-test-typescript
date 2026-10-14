import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryDoubleOptInThreshold } from "./primary-double-opt-in-threshold.js";

test("PrimaryDoubleOptInThreshold starts in draft", () => {
  const item = newPrimaryDoubleOptInThreshold("code-245", "title-887");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryDoubleOptInThreshold moves to active", () => {
  const item = newPrimaryDoubleOptInThreshold("code-245", "title-887");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PrimaryDoubleOptInThreshold rejects moves from closed", () => {
  const item = newPrimaryDoubleOptInThreshold("code-245", "title-887");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
