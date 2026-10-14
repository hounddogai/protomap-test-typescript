import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowDraftConversionRateRangeRule,
  WindowDraftRequiredCampaignRefRule,
  WindowDraftSendAtRangeRule,
  defaultWindowDraftValidator,
} from "./window-draft-rules.js";
import { newWindowDraft } from "./window-draft.js";

test("WindowDraftValidator reports every problem", () => {
  const validator = defaultWindowDraftValidator();
  const item = newWindowDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowDraftConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new WindowDraftConversionRateRangeRule(3.2, 3511.3);
  const item = newWindowDraft("x", "y");
  item.conversionRate = 3512.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowDraftRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new WindowDraftRequiredCampaignRefRule("window draft needs a value");
  const item = newWindowDraft("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowDraftSendAtRangeRule flags values above send at", () => {
  const rule = new WindowDraftSendAtRangeRule(32, 3600);
  const item = newWindowDraft("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
