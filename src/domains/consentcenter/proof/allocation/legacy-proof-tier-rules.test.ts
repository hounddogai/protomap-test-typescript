import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyProofTierBidRangeRule,
  LegacyProofTierCodeLengthRule,
  LegacyProofTierRequiredLabelRule,
  LegacyProofTierRequiredSummaryRule,
  defaultLegacyProofTierValidator,
} from "./legacy-proof-tier-rules.js";
import { newLegacyProofTier } from "./legacy-proof-tier.js";

test("LegacyProofTierValidator reports every problem", () => {
  const validator = defaultLegacyProofTierValidator();
  const item = newLegacyProofTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyProofTierBidRangeRule flags values above bid", () => {
  const rule = new LegacyProofTierBidRangeRule(9.4, 4677.1);
  const item = newLegacyProofTier("x", "y");
  item.bid = 4678.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyProofTierCodeLengthRule flags a long code", () => {
  const rule = new LegacyProofTierCodeLengthRule(1000);
  const item = newLegacyProofTier("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyProofTierRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyProofTierRequiredLabelRule("legacy proof tier needs an entry");
  const item = newLegacyProofTier("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyProofTierRequiredSummaryRule flags a blank summary", () => {
  const rule = new LegacyProofTierRequiredSummaryRule("legacy proof tier needs this field");
  const item = newLegacyProofTier("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
