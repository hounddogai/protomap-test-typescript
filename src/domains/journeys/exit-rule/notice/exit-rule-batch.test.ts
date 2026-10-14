import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleBatch } from "./exit-rule-batch.js";

test("ExitRuleBatch starts in new", () => {
  const item = newExitRuleBatch("code-615", "name-210");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleBatch moves to done", () => {
  const item = newExitRuleBatch("code-615", "name-210");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ExitRuleBatch rejects moves from failed", () => {
  const item = newExitRuleBatch("code-615", "name-210");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
