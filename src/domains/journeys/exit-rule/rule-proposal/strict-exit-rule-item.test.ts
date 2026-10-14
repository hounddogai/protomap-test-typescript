import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictExitRuleItem } from "./strict-exit-rule-item.js";

test("StrictExitRuleItem starts in proposed", () => {
  const item = newStrictExitRuleItem("code-128", "label-323");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictExitRuleItem moves to approved", () => {
  const item = newStrictExitRuleItem("code-128", "label-323");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("StrictExitRuleItem rejects moves from withdrawn", () => {
  const item = newStrictExitRuleItem("code-128", "label-323");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
