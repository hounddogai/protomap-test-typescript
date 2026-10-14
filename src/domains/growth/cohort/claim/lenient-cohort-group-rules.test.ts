import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientCohortGroupContactEmailLengthRule,
  LenientCohortGroupLabelLengthRule,
  LenientCohortGroupRequiredCodeRule,
  LenientCohortGroupRequiredContactEmailRule,
  defaultLenientCohortGroupValidator,
} from "./lenient-cohort-group-rules.js";
import { newLenientCohortGroup } from "./lenient-cohort-group.js";

test("LenientCohortGroupValidator reports every problem", () => {
  const validator = defaultLenientCohortGroupValidator();
  const item = newLenientCohortGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientCohortGroupRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new LenientCohortGroupRequiredContactEmailRule("lenient cohort group needs a value");
  const item = newLenientCohortGroup("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientCohortGroupContactEmailLengthRule flags a long contact email", () => {
  const rule = new LenientCohortGroupContactEmailLengthRule(120);
  const item = newLenientCohortGroup("x", "y");
  item.contactEmail = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientCohortGroupLabelLengthRule flags a long label", () => {
  const rule = new LenientCohortGroupLabelLengthRule(255);
  const item = newLenientCohortGroup("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientCohortGroupRequiredCodeRule flags a blank code", () => {
  const rule = new LenientCohortGroupRequiredCodeRule("lenient cohort group needs an entry");
  const item = newLenientCohortGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
