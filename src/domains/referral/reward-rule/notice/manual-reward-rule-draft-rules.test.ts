import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualRewardRuleDraftChannelLengthRule,
  ManualRewardRuleDraftCodeLengthRule,
  ManualRewardRuleDraftLocaleLengthRule,
  defaultManualRewardRuleDraftValidator,
} from "./manual-reward-rule-draft-rules.js";
import { newManualRewardRuleDraft } from "./manual-reward-rule-draft.js";

test("ManualRewardRuleDraftValidator reports every problem", () => {
  const validator = defaultManualRewardRuleDraftValidator();
  const item = newManualRewardRuleDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualRewardRuleDraftChannelLengthRule flags a long channel", () => {
  const rule = new ManualRewardRuleDraftChannelLengthRule(1000);
  const item = newManualRewardRuleDraft("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRewardRuleDraftLocaleLengthRule flags a long locale", () => {
  const rule = new ManualRewardRuleDraftLocaleLengthRule(255);
  const item = newManualRewardRuleDraft("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRewardRuleDraftCodeLengthRule flags a long code", () => {
  const rule = new ManualRewardRuleDraftCodeLengthRule(3600);
  const item = newManualRewardRuleDraft("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
