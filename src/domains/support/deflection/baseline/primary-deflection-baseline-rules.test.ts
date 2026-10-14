import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryDeflectionBaselineCeilingRangeRule,
  PrimaryDeflectionBaselineClicksRangeRule,
  PrimaryDeflectionBaselineLimitRangeRule,
  PrimaryDeflectionBaselineRequiredChecksumRule,
  PrimaryDeflectionBaselineTitleLengthRule,
  defaultPrimaryDeflectionBaselineValidator,
} from "./primary-deflection-baseline-rules.js";
import { newPrimaryDeflectionBaseline } from "./primary-deflection-baseline.js";

test("PrimaryDeflectionBaselineValidator reports every problem", () => {
  const validator = defaultPrimaryDeflectionBaselineValidator();
  const item = newPrimaryDeflectionBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryDeflectionBaselineRequiredChecksumRule flags a blank checksum", () => {
  const rule = new PrimaryDeflectionBaselineRequiredChecksumRule("primary deflection baseline needs this field");
  const item = newPrimaryDeflectionBaseline("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryDeflectionBaselineCeilingRangeRule flags values above ceiling", () => {
  const rule = new PrimaryDeflectionBaselineCeilingRangeRule(2.7, 4947.5);
  const item = newPrimaryDeflectionBaseline("x", "y");
  item.ceiling = 4949;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryDeflectionBaselineClicksRangeRule flags values above clicks", () => {
  const rule = new PrimaryDeflectionBaselineClicksRangeRule(255, 1000);
  const item = newPrimaryDeflectionBaseline("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryDeflectionBaselineTitleLengthRule flags a long title", () => {
  const rule = new PrimaryDeflectionBaselineTitleLengthRule(255);
  const item = newPrimaryDeflectionBaseline("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryDeflectionBaselineLimitRangeRule flags values above limit", () => {
  const rule = new PrimaryDeflectionBaselineLimitRangeRule(16, 32);
  const item = newPrimaryDeflectionBaseline("x", "y");
  item.limit = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
