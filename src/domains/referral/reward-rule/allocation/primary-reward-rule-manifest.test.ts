import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryRewardRuleManifest } from "./primary-reward-rule-manifest.js";

test("PrimaryRewardRuleManifest starts in draft", () => {
  const item = newPrimaryRewardRuleManifest("code-196", "name-732");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryRewardRuleManifest moves to active", () => {
  const item = newPrimaryRewardRuleManifest("code-196", "name-732");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PrimaryRewardRuleManifest rejects moves from closed", () => {
  const item = newPrimaryRewardRuleManifest("code-196", "name-732");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
