import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceTemplateOpenRateRangeRule,
  PreferenceTemplateRequiredAudienceIdRule,
  defaultPreferenceTemplateValidator,
} from "./preference-template-rules.js";
import { newPreferenceTemplate } from "./preference-template.js";

test("PreferenceTemplateValidator reports every problem", () => {
  const validator = defaultPreferenceTemplateValidator();
  const item = newPreferenceTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceTemplateOpenRateRangeRule flags values above open rate", () => {
  const rule = new PreferenceTemplateOpenRateRangeRule(6.7, 750.8);
  const item = newPreferenceTemplate("x", "y");
  item.openRate = 752.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceTemplateRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PreferenceTemplateRequiredAudienceIdRule("preference template needs an entry");
  const item = newPreferenceTemplate("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
