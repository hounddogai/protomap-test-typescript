import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientStreakPolicy } from "./lenient-streak-policy.js";

test("LenientStreakPolicy starts in proposed", () => {
  const item = newLenientStreakPolicy("code-668", "title-527");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientStreakPolicy moves to rejected", () => {
  const item = newLenientStreakPolicy("code-668", "title-527");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LenientStreakPolicy rejects moves from withdrawn", () => {
  const item = newLenientStreakPolicy("code-668", "title-527");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
