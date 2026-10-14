import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleException } from "./exit-rule-exception.js";

test("ExitRuleException starts in idle", () => {
  const item = newExitRuleException("code-51", "name-595");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleException moves to ready", () => {
  const item = newExitRuleException("code-51", "name-595");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ExitRuleException rejects moves from stopped", () => {
  const item = newExitRuleException("code-51", "name-595");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
