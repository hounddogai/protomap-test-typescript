import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientStreakVariance } from "./lenient-streak-variance.js";

test("LenientStreakVariance starts in proposed", () => {
  const item = newLenientStreakVariance("code-65", "title-456");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientStreakVariance moves to approved", () => {
  const item = newLenientStreakVariance("code-65", "title-456");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientStreakVariance rejects moves from withdrawn", () => {
  const item = newLenientStreakVariance("code-65", "title-456");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
