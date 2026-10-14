import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalExitRuleBaseline } from "./regional-exit-rule-baseline.js";

test("RegionalExitRuleBaseline starts in planned", () => {
  const item = newRegionalExitRuleBaseline("code-560", "name-152");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalExitRuleBaseline moves to scheduled", () => {
  const item = newRegionalExitRuleBaseline("code-560", "name-152");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RegionalExitRuleBaseline rejects moves from cancelled", () => {
  const item = newRegionalExitRuleBaseline("code-560", "name-152");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
