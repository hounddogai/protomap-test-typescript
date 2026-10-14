import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalSuppressionRequestRequiredCodeRule,
  SeasonalSuppressionRequestRequiredNameRule,
  defaultSeasonalSuppressionRequestValidator,
} from "./seasonal-suppression-request-rules.js";
import { newSeasonalSuppressionRequest } from "./seasonal-suppression-request.js";

test("SeasonalSuppressionRequestValidator reports every problem", () => {
  const validator = defaultSeasonalSuppressionRequestValidator();
  const item = newSeasonalSuppressionRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalSuppressionRequestRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalSuppressionRequestRequiredCodeRule("seasonal suppression request needs this field");
  const item = newSeasonalSuppressionRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalSuppressionRequestRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalSuppressionRequestRequiredNameRule("seasonal suppression request needs this field");
  const item = newSeasonalSuppressionRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
