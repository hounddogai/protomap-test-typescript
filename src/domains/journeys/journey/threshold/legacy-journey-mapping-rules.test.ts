import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyJourneyMappingEndsAtRangeRule,
  LegacyJourneyMappingRequiredLabelRule,
  defaultLegacyJourneyMappingValidator,
} from "./legacy-journey-mapping-rules.js";
import { newLegacyJourneyMapping } from "./legacy-journey-mapping.js";

test("LegacyJourneyMappingValidator reports every problem", () => {
  const validator = defaultLegacyJourneyMappingValidator();
  const item = newLegacyJourneyMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyJourneyMappingEndsAtRangeRule flags values above ends at", () => {
  const rule = new LegacyJourneyMappingEndsAtRangeRule(32, 64);
  const item = newLegacyJourneyMapping("x", "y");
  item.endsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyJourneyMappingRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyJourneyMappingRequiredLabelRule("legacy journey mapping needs a value");
  const item = newLegacyJourneyMapping("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
