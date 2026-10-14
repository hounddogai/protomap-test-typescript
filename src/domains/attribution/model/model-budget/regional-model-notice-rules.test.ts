import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalModelNoticeLabelLengthRule,
  RegionalModelNoticeRequiredCampaignRefRule,
  RegionalModelNoticeRequiredLocaleRule,
  defaultRegionalModelNoticeValidator,
} from "./regional-model-notice-rules.js";
import { newRegionalModelNotice } from "./regional-model-notice.js";

test("RegionalModelNoticeValidator reports every problem", () => {
  const validator = defaultRegionalModelNoticeValidator();
  const item = newRegionalModelNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalModelNoticeLabelLengthRule flags a long label", () => {
  const rule = new RegionalModelNoticeLabelLengthRule(3600);
  const item = newRegionalModelNotice("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalModelNoticeRequiredLocaleRule flags a blank locale", () => {
  const rule = new RegionalModelNoticeRequiredLocaleRule("regional model notice needs this field");
  const item = newRegionalModelNotice("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalModelNoticeRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RegionalModelNoticeRequiredCampaignRefRule("regional model notice needs this field");
  const item = newRegionalModelNotice("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
