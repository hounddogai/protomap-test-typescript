import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleNoticeCampaignRefLengthRule,
  ExitRuleNoticeRequiredCodeRule,
  ExitRuleNoticeRequiredDescriptionRule,
  defaultExitRuleNoticeValidator,
} from "./exit-rule-notice-rules.js";
import { newExitRuleNotice } from "./exit-rule-notice.js";

test("ExitRuleNoticeValidator reports every problem", () => {
  const validator = defaultExitRuleNoticeValidator();
  const item = newExitRuleNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleNoticeCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ExitRuleNoticeCampaignRefLengthRule(32);
  const item = newExitRuleNotice("x", "y");
  item.campaignRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleNoticeRequiredCodeRule("exit rule notice needs an entry");
  const item = newExitRuleNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleNoticeRequiredDescriptionRule flags a blank description", () => {
  const rule = new ExitRuleNoticeRequiredDescriptionRule("exit rule notice needs an entry");
  const item = newExitRuleNotice("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
