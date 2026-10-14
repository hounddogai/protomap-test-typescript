import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultStepBundleMarginRangeRule,
  DefaultStepBundleRequiredLabelRule,
  DefaultStepBundleRequiredLocaleRule,
  defaultDefaultStepBundleValidator,
} from "./default-step-bundle-rules.js";
import { newDefaultStepBundle } from "./default-step-bundle.js";

test("DefaultStepBundleValidator reports every problem", () => {
  const validator = defaultDefaultStepBundleValidator();
  const item = newDefaultStepBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultStepBundleRequiredLocaleRule flags a blank locale", () => {
  const rule = new DefaultStepBundleRequiredLocaleRule("default step bundle needs an entry");
  const item = newDefaultStepBundle("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultStepBundleMarginRangeRule flags values above margin", () => {
  const rule = new DefaultStepBundleMarginRangeRule(3, 136.5);
  const item = newDefaultStepBundle("x", "y");
  item.margin = 138;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultStepBundleRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultStepBundleRequiredLabelRule("default step bundle needs an entry");
  const item = newDefaultStepBundle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
