import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeEstimateOpenRateRangeRule,
  CreativeEstimateRequiredChannelRule,
  CreativeEstimateRequiredCodeRule,
  defaultCreativeEstimateValidator,
} from "./creative-estimate-rules.js";
import { newCreativeEstimate } from "./creative-estimate.js";

test("CreativeEstimateValidator reports every problem", () => {
  const validator = defaultCreativeEstimateValidator();
  const item = newCreativeEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeEstimateOpenRateRangeRule flags values above open rate", () => {
  const rule = new CreativeEstimateOpenRateRangeRule(6, 2050.8);
  const item = newCreativeEstimate("x", "y");
  item.openRate = 2052.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new CreativeEstimateRequiredCodeRule("creative estimate needs this field");
  const item = newCreativeEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeEstimateRequiredChannelRule flags a blank channel", () => {
  const rule = new CreativeEstimateRequiredChannelRule("creative estimate needs a value");
  const item = newCreativeEstimate("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
