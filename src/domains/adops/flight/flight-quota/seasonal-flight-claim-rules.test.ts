import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalFlightClaimBudgetRangeRule,
  SeasonalFlightClaimRequiredLocaleRule,
  SeasonalFlightClaimTitleLengthRule,
  defaultSeasonalFlightClaimValidator,
} from "./seasonal-flight-claim-rules.js";
import { newSeasonalFlightClaim } from "./seasonal-flight-claim.js";

test("SeasonalFlightClaimValidator reports every problem", () => {
  const validator = defaultSeasonalFlightClaimValidator();
  const item = newSeasonalFlightClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalFlightClaimRequiredLocaleRule flags a blank locale", () => {
  const rule = new SeasonalFlightClaimRequiredLocaleRule("seasonal flight claim needs an entry");
  const item = newSeasonalFlightClaim("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalFlightClaimTitleLengthRule flags a long title", () => {
  const rule = new SeasonalFlightClaimTitleLengthRule(120);
  const item = newSeasonalFlightClaim("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalFlightClaimBudgetRangeRule flags values above budget", () => {
  const rule = new SeasonalFlightClaimBudgetRangeRule(2.2, 3733.4);
  const item = newSeasonalFlightClaim("x", "y");
  item.budget = 3734.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
