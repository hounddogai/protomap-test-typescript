import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleGroup } from "./exit-rule-group.js";

test("ExitRuleGroup starts in proposed", () => {
  const item = newExitRuleGroup("code-60", "name-466");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleGroup moves to approved", () => {
  const item = newExitRuleGroup("code-60", "name-466");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ExitRuleGroup rejects moves from withdrawn", () => {
  const item = newExitRuleGroup("code-60", "name-466");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
