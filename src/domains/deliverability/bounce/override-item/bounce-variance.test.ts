import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceVariance } from "./bounce-variance.js";

test("BounceVariance starts in planned", () => {
  const item = newBounceVariance("code-189", "name-617");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceVariance moves to in progress", () => {
  const item = newBounceVariance("code-189", "name-617");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("BounceVariance rejects moves from cancelled", () => {
  const item = newBounceVariance("code-189", "name-617");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
