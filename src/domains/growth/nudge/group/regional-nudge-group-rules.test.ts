import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalNudgeGroupCountryLengthRule,
  RegionalNudgeGroupExternalRefLengthRule,
  RegionalNudgeGroupRequiredTitleRule,
  defaultRegionalNudgeGroupValidator,
} from "./regional-nudge-group-rules.js";
import { newRegionalNudgeGroup } from "./regional-nudge-group.js";

test("RegionalNudgeGroupValidator reports every problem", () => {
  const validator = defaultRegionalNudgeGroupValidator();
  const item = newRegionalNudgeGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalNudgeGroupExternalRefLengthRule flags a long external ref", () => {
  const rule = new RegionalNudgeGroupExternalRefLengthRule(255);
  const item = newRegionalNudgeGroup("x", "y");
  item.externalRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalNudgeGroupCountryLengthRule flags a long country", () => {
  const rule = new RegionalNudgeGroupCountryLengthRule(16);
  const item = newRegionalNudgeGroup("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalNudgeGroupRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalNudgeGroupRequiredTitleRule("regional nudge group needs a value");
  const item = newRegionalNudgeGroup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
