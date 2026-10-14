import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleItem } from "./exit-rule-item.js";

test("ExitRuleItem starts in created", () => {
  const item = newExitRuleItem("code-530", "label-890");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleItem moves to validated", () => {
  const item = newExitRuleItem("code-530", "label-890");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ExitRuleItem rejects moves from retired", () => {
  const item = newExitRuleItem("code-530", "label-890");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
