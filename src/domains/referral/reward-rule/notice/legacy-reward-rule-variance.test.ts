import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyRewardRuleVariance } from "./legacy-reward-rule-variance.js";

test("LegacyRewardRuleVariance starts in requested", () => {
  const item = newLegacyRewardRuleVariance("code-809", "name-249");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyRewardRuleVariance moves to revoked", () => {
  const item = newLegacyRewardRuleVariance("code-809", "name-249");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LegacyRewardRuleVariance rejects moves from expired", () => {
  const item = newLegacyRewardRuleVariance("code-809", "name-249");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
