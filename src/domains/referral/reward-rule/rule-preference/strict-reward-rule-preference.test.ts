import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictRewardRulePreference } from "./strict-reward-rule-preference.js";

test("StrictRewardRulePreference starts in requested", () => {
  const item = newStrictRewardRulePreference("code-235", "label-919");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictRewardRulePreference moves to revoked", () => {
  const item = newStrictRewardRulePreference("code-235", "label-919");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictRewardRulePreference rejects moves from expired", () => {
  const item = newStrictRewardRulePreference("code-235", "label-919");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
