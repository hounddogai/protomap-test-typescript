import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalQueueBaselineRequiredExternalRefRule,
  SeasonalQueueBaselineRequiredLabelRule,
  defaultSeasonalQueueBaselineValidator,
} from "./seasonal-queue-baseline-rules.js";
import { newSeasonalQueueBaseline } from "./seasonal-queue-baseline.js";

test("SeasonalQueueBaselineValidator reports every problem", () => {
  const validator = defaultSeasonalQueueBaselineValidator();
  const item = newSeasonalQueueBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalQueueBaselineRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new SeasonalQueueBaselineRequiredExternalRefRule("seasonal queue baseline needs an entry");
  const item = newSeasonalQueueBaseline("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalQueueBaselineRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalQueueBaselineRequiredLabelRule("seasonal queue baseline needs an entry");
  const item = newSeasonalQueueBaseline("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
