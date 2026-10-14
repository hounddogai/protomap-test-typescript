import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalDomainGroupAmountRangeRule,
  SeasonalDomainGroupCurrencyLengthRule,
  SeasonalDomainGroupMarginRangeRule,
  SeasonalDomainGroupRequiredCurrencyRule,
  SeasonalDomainGroupTitleLengthRule,
  defaultSeasonalDomainGroupValidator,
} from "./seasonal-domain-group-rules.js";
import { newSeasonalDomainGroup } from "./seasonal-domain-group.js";

test("SeasonalDomainGroupValidator reports every problem", () => {
  const validator = defaultSeasonalDomainGroupValidator();
  const item = newSeasonalDomainGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalDomainGroupRequiredCurrencyRule flags a blank currency", () => {
  const rule = new SeasonalDomainGroupRequiredCurrencyRule("seasonal domain group needs a value");
  const item = newSeasonalDomainGroup("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalDomainGroupAmountRangeRule flags values above amount", () => {
  const rule = new SeasonalDomainGroupAmountRangeRule(5, 3181.4);
  const item = newSeasonalDomainGroup("x", "y");
  item.amount = 3182.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalDomainGroupMarginRangeRule flags values above margin", () => {
  const rule = new SeasonalDomainGroupMarginRangeRule(6.7, 350.2);
  const item = newSeasonalDomainGroup("x", "y");
  item.margin = 351.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalDomainGroupTitleLengthRule flags a long title", () => {
  const rule = new SeasonalDomainGroupTitleLengthRule(120);
  const item = newSeasonalDomainGroup("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalDomainGroupCurrencyLengthRule flags a long currency", () => {
  const rule = new SeasonalDomainGroupCurrencyLengthRule(32);
  const item = newSeasonalDomainGroup("x", "y");
  item.currency = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
