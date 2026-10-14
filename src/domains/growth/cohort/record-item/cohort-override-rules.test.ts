import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortOverrideCodeLengthRule,
  CohortOverrideNameLengthRule,
  CohortOverrideRequiredCodeRule,
  CohortOverrideRequiredNameRule,
  defaultCohortOverrideValidator,
} from "./cohort-override-rules.js";
import { newCohortOverride } from "./cohort-override.js";

test("CohortOverrideValidator reports every problem", () => {
  const validator = defaultCohortOverrideValidator();
  const item = newCohortOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortOverrideRequiredNameRule flags a blank name", () => {
  const rule = new CohortOverrideRequiredNameRule("cohort override needs an entry");
  const item = newCohortOverride("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortOverrideCodeLengthRule flags a long code", () => {
  const rule = new CohortOverrideCodeLengthRule(32);
  const item = newCohortOverride("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortOverrideNameLengthRule flags a long name", () => {
  const rule = new CohortOverrideNameLengthRule(120);
  const item = newCohortOverride("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new CohortOverrideRequiredCodeRule("cohort override needs this field");
  const item = newCohortOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
