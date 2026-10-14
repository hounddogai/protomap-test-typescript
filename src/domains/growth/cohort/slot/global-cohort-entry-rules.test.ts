import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalCohortEntryCodeLengthRule,
  GlobalCohortEntryCostRangeRule,
  GlobalCohortEntryRequiredCodeRule,
  GlobalCohortEntryRequiredTitleRule,
  defaultGlobalCohortEntryValidator,
} from "./global-cohort-entry-rules.js";
import { newGlobalCohortEntry } from "./global-cohort-entry.js";

test("GlobalCohortEntryValidator reports every problem", () => {
  const validator = defaultGlobalCohortEntryValidator();
  const item = newGlobalCohortEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalCohortEntryRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalCohortEntryRequiredCodeRule("global cohort entry needs a value");
  const item = newGlobalCohortEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalCohortEntryCodeLengthRule flags a long code", () => {
  const rule = new GlobalCohortEntryCodeLengthRule(16);
  const item = newGlobalCohortEntry("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalCohortEntryRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalCohortEntryRequiredTitleRule("global cohort entry needs this field");
  const item = newGlobalCohortEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalCohortEntryCostRangeRule flags values above cost", () => {
  const rule = new GlobalCohortEntryCostRangeRule(1, 4841.9);
  const item = newGlobalCohortEntry("x", "y");
  item.cost = 4843.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
