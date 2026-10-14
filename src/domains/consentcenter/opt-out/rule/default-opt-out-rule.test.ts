import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultOptOutRule } from "./default-opt-out-rule.js";

test("DefaultOptOutRule starts in open", () => {
  const item = newDefaultOptOutRule("code-799", "name-315");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultOptOutRule moves to in review", () => {
  const item = newDefaultOptOutRule("code-799", "name-315");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("DefaultOptOutRule rejects moves from archived", () => {
  const item = newDefaultOptOutRule("code-799", "name-315");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
