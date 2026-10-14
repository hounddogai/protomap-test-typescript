import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualExitRuleBaseline } from "./manual-exit-rule-baseline.js";

test("ManualExitRuleBaseline starts in draft", () => {
  const item = newManualExitRuleBaseline("code-471", "name-927");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualExitRuleBaseline moves to active", () => {
  const item = newManualExitRuleBaseline("code-471", "name-927");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ManualExitRuleBaseline rejects moves from closed", () => {
  const item = newManualExitRuleBaseline("code-471", "name-927");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
