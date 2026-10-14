import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleAdjustment } from "./exit-rule-adjustment.js";

test("ExitRuleAdjustment starts in proposed", () => {
  const item = newExitRuleAdjustment("code-715", "title-724");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleAdjustment moves to rejected", () => {
  const item = newExitRuleAdjustment("code-715", "title-724");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ExitRuleAdjustment rejects moves from withdrawn", () => {
  const item = newExitRuleAdjustment("code-715", "title-724");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
