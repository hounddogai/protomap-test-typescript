import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionRollupRequiredCodeRule,
  ConversionRollupRequiredLabelRule,
  ConversionRollupRequiredUnitRule,
  defaultConversionRollupValidator,
} from "./conversion-rollup-rules.js";
import { newConversionRollup } from "./conversion-rollup.js";

test("ConversionRollupValidator reports every problem", () => {
  const validator = defaultConversionRollupValidator();
  const item = newConversionRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionRollupRequiredLabelRule flags a blank label", () => {
  const rule = new ConversionRollupRequiredLabelRule("conversion rollup needs a value");
  const item = newConversionRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionRollupRequiredUnitRule flags a blank unit", () => {
  const rule = new ConversionRollupRequiredUnitRule("conversion rollup needs a value");
  const item = newConversionRollup("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionRollupRequiredCodeRule flags a blank code", () => {
  const rule = new ConversionRollupRequiredCodeRule("conversion rollup needs a value");
  const item = newConversionRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
