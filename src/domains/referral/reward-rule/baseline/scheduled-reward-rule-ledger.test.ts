import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledRewardRuleLedger } from "./scheduled-reward-rule-ledger.js";

test("ScheduledRewardRuleLedger starts in requested", () => {
  const item = newScheduledRewardRuleLedger("code-603", "title-432");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledRewardRuleLedger moves to granted", () => {
  const item = newScheduledRewardRuleLedger("code-603", "title-432");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ScheduledRewardRuleLedger rejects moves from expired", () => {
  const item = newScheduledRewardRuleLedger("code-603", "title-432");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
