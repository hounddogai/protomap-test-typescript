import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledFraudCheckRule } from "./scheduled-fraud-check-rule.js";

test("ScheduledFraudCheckRule starts in created", () => {
  const item = newScheduledFraudCheckRule("code-349", "name-879");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledFraudCheckRule moves to validated", () => {
  const item = newScheduledFraudCheckRule("code-349", "name-879");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ScheduledFraudCheckRule rejects moves from retired", () => {
  const item = newScheduledFraudCheckRule("code-349", "name-879");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
