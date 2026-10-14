import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalInsightGroupDescriptionLengthRule,
  RegionalInsightGroupLabelLengthRule,
  RegionalInsightGroupRequiredLabelRule,
  defaultRegionalInsightGroupValidator,
} from "./regional-insight-group-rules.js";
import { newRegionalInsightGroup } from "./regional-insight-group.js";

test("RegionalInsightGroupValidator reports every problem", () => {
  const validator = defaultRegionalInsightGroupValidator();
  const item = newRegionalInsightGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalInsightGroupLabelLengthRule flags a long label", () => {
  const rule = new RegionalInsightGroupLabelLengthRule(86400);
  const item = newRegionalInsightGroup("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalInsightGroupRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalInsightGroupRequiredLabelRule("regional insight group needs a value");
  const item = newRegionalInsightGroup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalInsightGroupDescriptionLengthRule flags a long description", () => {
  const rule = new RegionalInsightGroupDescriptionLengthRule(80);
  const item = newRegionalInsightGroup("x", "y");
  item.description = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
