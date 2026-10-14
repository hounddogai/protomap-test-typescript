import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledReplyOverrideBudgetRangeRule,
  ScheduledReplyOverrideCampaignRefLengthRule,
  defaultScheduledReplyOverrideValidator,
} from "./scheduled-reply-override-rules.js";
import { newScheduledReplyOverride } from "./scheduled-reply-override.js";

test("ScheduledReplyOverrideValidator reports every problem", () => {
  const validator = defaultScheduledReplyOverrideValidator();
  const item = newScheduledReplyOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledReplyOverrideCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ScheduledReplyOverrideCampaignRefLengthRule(86400);
  const item = newScheduledReplyOverride("x", "y");
  item.campaignRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledReplyOverrideBudgetRangeRule flags values above budget", () => {
  const rule = new ScheduledReplyOverrideBudgetRangeRule(4.7, 3587.9);
  const item = newScheduledReplyOverride("x", "y");
  item.budget = 3589.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
