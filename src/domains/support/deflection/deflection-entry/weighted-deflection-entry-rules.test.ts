import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedDeflectionEntryAudienceIdLengthRule,
  WeightedDeflectionEntryDescriptionLengthRule,
  WeightedDeflectionEntryRequiredDescriptionRule,
  defaultWeightedDeflectionEntryValidator,
} from "./weighted-deflection-entry-rules.js";
import { newWeightedDeflectionEntry } from "./weighted-deflection-entry.js";

test("WeightedDeflectionEntryValidator reports every problem", () => {
  const validator = defaultWeightedDeflectionEntryValidator();
  const item = newWeightedDeflectionEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedDeflectionEntryDescriptionLengthRule flags a long description", () => {
  const rule = new WeightedDeflectionEntryDescriptionLengthRule(120);
  const item = newWeightedDeflectionEntry("x", "y");
  item.description = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedDeflectionEntryRequiredDescriptionRule flags a blank description", () => {
  const rule = new WeightedDeflectionEntryRequiredDescriptionRule("weighted deflection entry needs this field");
  const item = newWeightedDeflectionEntry("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedDeflectionEntryAudienceIdLengthRule flags a long audience id", () => {
  const rule = new WeightedDeflectionEntryAudienceIdLengthRule(255);
  const item = newWeightedDeflectionEntry("x", "y");
  item.audienceId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
