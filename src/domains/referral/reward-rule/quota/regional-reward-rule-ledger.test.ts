import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalRewardRuleLedger } from "./regional-reward-rule-ledger.js";

test("RegionalRewardRuleLedger starts in planned", () => {
  const item = newRegionalRewardRuleLedger("code-188", "label-916");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalRewardRuleLedger moves to completed", () => {
  const item = newRegionalRewardRuleLedger("code-188", "label-916");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("RegionalRewardRuleLedger rejects moves from cancelled", () => {
  const item = newRegionalRewardRuleLedger("code-188", "label-916");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
