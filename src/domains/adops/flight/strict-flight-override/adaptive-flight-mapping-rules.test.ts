import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveFlightMappingOpenRateRangeRule,
  AdaptiveFlightMappingRequiredNameRule,
  defaultAdaptiveFlightMappingValidator,
} from "./adaptive-flight-mapping-rules.js";
import { newAdaptiveFlightMapping } from "./adaptive-flight-mapping.js";

test("AdaptiveFlightMappingValidator reports every problem", () => {
  const validator = defaultAdaptiveFlightMappingValidator();
  const item = newAdaptiveFlightMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveFlightMappingRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveFlightMappingRequiredNameRule("adaptive flight mapping needs this field");
  const item = newAdaptiveFlightMapping("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveFlightMappingOpenRateRangeRule flags values above open rate", () => {
  const rule = new AdaptiveFlightMappingOpenRateRangeRule(0.2, 3045.7);
  const item = newAdaptiveFlightMapping("x", "y");
  item.openRate = 3047.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
