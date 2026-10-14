import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredChallengeTierCodeLengthRule,
  TieredChallengeTierMarginRangeRule,
  TieredChallengeTierRequiredLabelRule,
  TieredChallengeTierRequiredNameRule,
  defaultTieredChallengeTierValidator,
} from "./tiered-challenge-tier-rules.js";
import { newTieredChallengeTier } from "./tiered-challenge-tier.js";

test("TieredChallengeTierValidator reports every problem", () => {
  const validator = defaultTieredChallengeTierValidator();
  const item = newTieredChallengeTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredChallengeTierRequiredNameRule flags a blank name", () => {
  const rule = new TieredChallengeTierRequiredNameRule("tiered challenge tier needs a value");
  const item = newTieredChallengeTier("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredChallengeTierCodeLengthRule flags a long code", () => {
  const rule = new TieredChallengeTierCodeLengthRule(80);
  const item = newTieredChallengeTier("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredChallengeTierRequiredLabelRule flags a blank label", () => {
  const rule = new TieredChallengeTierRequiredLabelRule("tiered challenge tier needs this field");
  const item = newTieredChallengeTier("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredChallengeTierMarginRangeRule flags values above margin", () => {
  const rule = new TieredChallengeTierMarginRangeRule(9.7, 1417.8);
  const item = newTieredChallengeTier("x", "y");
  item.margin = 1419.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
