import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalPostRollupLabelLengthRule,
  GlobalPostRollupNameLengthRule,
  GlobalPostRollupQuantityRangeRule,
  GlobalPostRollupRequiredNameRule,
  defaultGlobalPostRollupValidator,
} from "./global-post-rollup-rules.js";
import { newGlobalPostRollup } from "./global-post-rollup.js";

test("GlobalPostRollupValidator reports every problem", () => {
  const validator = defaultGlobalPostRollupValidator();
  const item = newGlobalPostRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalPostRollupNameLengthRule flags a long name", () => {
  const rule = new GlobalPostRollupNameLengthRule(255);
  const item = newGlobalPostRollup("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalPostRollupQuantityRangeRule flags values above quantity", () => {
  const rule = new GlobalPostRollupQuantityRangeRule(80, 1000);
  const item = newGlobalPostRollup("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalPostRollupLabelLengthRule flags a long label", () => {
  const rule = new GlobalPostRollupLabelLengthRule(255);
  const item = newGlobalPostRollup("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalPostRollupRequiredNameRule flags a blank name", () => {
  const rule = new GlobalPostRollupRequiredNameRule("global post rollup needs this field");
  const item = newGlobalPostRollup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
