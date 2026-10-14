import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredFunnelMappingCohortLengthRule,
  TieredFunnelMappingRevisionRangeRule,
  defaultTieredFunnelMappingValidator,
} from "./tiered-funnel-mapping-rules.js";
import { newTieredFunnelMapping } from "./tiered-funnel-mapping.js";

test("TieredFunnelMappingValidator reports every problem", () => {
  const validator = defaultTieredFunnelMappingValidator();
  const item = newTieredFunnelMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredFunnelMappingRevisionRangeRule flags values above revision", () => {
  const rule = new TieredFunnelMappingRevisionRangeRule(1000, 1000);
  const item = newTieredFunnelMapping("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredFunnelMappingCohortLengthRule flags a long cohort", () => {
  const rule = new TieredFunnelMappingCohortLengthRule(120);
  const item = newTieredFunnelMapping("x", "y");
  item.cohort = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
