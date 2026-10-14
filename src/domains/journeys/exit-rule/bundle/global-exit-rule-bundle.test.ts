import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalExitRuleBundle } from "./global-exit-rule-bundle.js";

test("GlobalExitRuleBundle starts in idle", () => {
  const item = newGlobalExitRuleBundle("code-186", "name-44");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalExitRuleBundle moves to warming", () => {
  const item = newGlobalExitRuleBundle("code-186", "name-44");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("GlobalExitRuleBundle rejects moves from stopped", () => {
  const item = newGlobalExitRuleBundle("code-186", "name-44");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
