import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingLevelRule } from "./rolling-level-rule.js";

test("RollingLevelRule starts in open", () => {
  const item = newRollingLevelRule("code-731", "name-550");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingLevelRule moves to resolved", () => {
  const item = newRollingLevelRule("code-731", "name-550");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RollingLevelRule rejects moves from archived", () => {
  const item = newRollingLevelRule("code-731", "name-550");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
