import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakException } from "./streak-exception.js";

test("StreakException starts in open", () => {
  const item = newStreakException("code-926", "name-75");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakException moves to resolved", () => {
  const item = newStreakException("code-926", "name-75");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("StreakException rejects moves from archived", () => {
  const item = newStreakException("code-926", "name-75");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
