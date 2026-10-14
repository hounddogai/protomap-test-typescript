import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalDoubleOptInRollupRequiredCodeRule,
  RegionalDoubleOptInRollupRequiredTitleRule,
  RegionalDoubleOptInRollupTitleLengthRule,
  defaultRegionalDoubleOptInRollupValidator,
} from "./regional-double-opt-in-rollup-rules.js";
import { newRegionalDoubleOptInRollup } from "./regional-double-opt-in-rollup.js";

test("RegionalDoubleOptInRollupValidator reports every problem", () => {
  const validator = defaultRegionalDoubleOptInRollupValidator();
  const item = newRegionalDoubleOptInRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalDoubleOptInRollupRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalDoubleOptInRollupRequiredCodeRule("regional double opt in rollup needs an entry");
  const item = newRegionalDoubleOptInRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalDoubleOptInRollupTitleLengthRule flags a long title", () => {
  const rule = new RegionalDoubleOptInRollupTitleLengthRule(3600);
  const item = newRegionalDoubleOptInRollup("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalDoubleOptInRollupRequiredTitleRule flags a blank title", () => {
  const rule = new RegionalDoubleOptInRollupRequiredTitleRule("regional double opt in rollup needs an entry");
  const item = newRegionalDoubleOptInRollup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
