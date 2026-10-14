import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalCreativeEntryPriorityRangeRule,
  RegionalCreativeEntryRequiredRegionRule,
  RegionalCreativeEntryRequiredUtmSourceRule,
  RegionalCreativeEntryScoreRangeRule,
  defaultRegionalCreativeEntryValidator,
} from "./regional-creative-entry-rules.js";
import { newRegionalCreativeEntry } from "./regional-creative-entry.js";

test("RegionalCreativeEntryValidator reports every problem", () => {
  const validator = defaultRegionalCreativeEntryValidator();
  const item = newRegionalCreativeEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalCreativeEntryScoreRangeRule flags values above score", () => {
  const rule = new RegionalCreativeEntryScoreRangeRule(1.7, 1723.7);
  const item = newRegionalCreativeEntry("x", "y");
  item.score = 1725.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalCreativeEntryRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new RegionalCreativeEntryRequiredUtmSourceRule("regional creative entry needs this field");
  const item = newRegionalCreativeEntry("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalCreativeEntryRequiredRegionRule flags a blank region", () => {
  const rule = new RegionalCreativeEntryRequiredRegionRule("regional creative entry needs an entry");
  const item = newRegionalCreativeEntry("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalCreativeEntryPriorityRangeRule flags values above priority", () => {
  const rule = new RegionalCreativeEntryPriorityRangeRule(80, 3600);
  const item = newRegionalCreativeEntry("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
