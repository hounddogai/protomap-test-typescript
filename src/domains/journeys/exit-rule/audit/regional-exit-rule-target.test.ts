import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalExitRuleTarget } from "./regional-exit-rule-target.js";

test("RegionalExitRuleTarget starts in idle", () => {
  const item = newRegionalExitRuleTarget("code-615", "label-694");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalExitRuleTarget moves to ready", () => {
  const item = newRegionalExitRuleTarget("code-615", "label-694");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RegionalExitRuleTarget rejects moves from stopped", () => {
  const item = newRegionalExitRuleTarget("code-615", "label-694");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
