import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictNudgeBudget } from "./strict-nudge-budget.js";

test("StrictNudgeBudget starts in open", () => {
  const item = newStrictNudgeBudget("code-831", "title-492");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictNudgeBudget moves to in review", () => {
  const item = newStrictNudgeBudget("code-831", "title-492");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("StrictNudgeBudget rejects moves from archived", () => {
  const item = newStrictNudgeBudget("code-831", "title-492");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
