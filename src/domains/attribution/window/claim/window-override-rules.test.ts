import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowOverrideJourneyIdLengthRule,
  WindowOverrideRequiredCampaignRefRule,
  WindowOverrideTitleLengthRule,
  WindowOverrideUpdatedAtRangeRule,
  defaultWindowOverrideValidator,
} from "./window-override-rules.js";
import { newWindowOverride } from "./window-override.js";

test("WindowOverrideValidator reports every problem", () => {
  const validator = defaultWindowOverrideValidator();
  const item = newWindowOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowOverrideJourneyIdLengthRule flags a long journey id", () => {
  const rule = new WindowOverrideJourneyIdLengthRule(1000);
  const item = newWindowOverride("x", "y");
  item.journeyId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowOverrideTitleLengthRule flags a long title", () => {
  const rule = new WindowOverrideTitleLengthRule(120);
  const item = newWindowOverride("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowOverrideRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new WindowOverrideRequiredCampaignRefRule("window override needs a value");
  const item = newWindowOverride("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowOverrideUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new WindowOverrideUpdatedAtRangeRule(255, 1000);
  const item = newWindowOverride("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
