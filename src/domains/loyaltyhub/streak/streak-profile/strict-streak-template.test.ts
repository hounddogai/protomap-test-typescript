import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictStreakTemplate } from "./strict-streak-template.js";

test("StrictStreakTemplate starts in open", () => {
  const item = newStrictStreakTemplate("code-353", "title-341");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictStreakTemplate moves to in review", () => {
  const item = newStrictStreakTemplate("code-353", "title-341");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("StrictStreakTemplate rejects moves from archived", () => {
  const item = newStrictStreakTemplate("code-353", "title-341");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
