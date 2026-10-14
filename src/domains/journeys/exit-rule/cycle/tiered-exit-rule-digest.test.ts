import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredExitRuleDigest } from "./tiered-exit-rule-digest.js";

test("TieredExitRuleDigest starts in created", () => {
  const item = newTieredExitRuleDigest("code-628", "name-453");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredExitRuleDigest moves to validated", () => {
  const item = newTieredExitRuleDigest("code-628", "name-453");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredExitRuleDigest rejects moves from retired", () => {
  const item = newTieredExitRuleDigest("code-628", "name-453");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
