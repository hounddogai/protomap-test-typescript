import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredExitRuleEntry } from "./tiered-exit-rule-entry.js";

test("TieredExitRuleEntry starts in idle", () => {
  const item = newTieredExitRuleEntry("code-480", "title-897");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredExitRuleEntry moves to stopped", () => {
  const item = newTieredExitRuleEntry("code-480", "title-897");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("TieredExitRuleEntry rejects moves from stopped", () => {
  const item = newTieredExitRuleEntry("code-480", "title-897");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
