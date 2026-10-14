import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleScore } from "./exit-rule-score.js";

test("ExitRuleScore starts in proposed", () => {
  const item = newExitRuleScore("code-718", "name-958");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleScore moves to approved", () => {
  const item = newExitRuleScore("code-718", "name-958");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ExitRuleScore rejects moves from withdrawn", () => {
  const item = newExitRuleScore("code-718", "name-958");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
