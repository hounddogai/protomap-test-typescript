import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleAudit } from "./exit-rule-audit.js";

test("ExitRuleAudit starts in idle", () => {
  const item = newExitRuleAudit("code-579", "name-183");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleAudit moves to warming", () => {
  const item = newExitRuleAudit("code-579", "name-183");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ExitRuleAudit rejects moves from stopped", () => {
  const item = newExitRuleAudit("code-579", "name-183");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
