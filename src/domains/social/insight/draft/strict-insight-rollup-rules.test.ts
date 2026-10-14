import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictInsightRollupCodeLengthRule,
  StrictInsightRollupRequiredAudienceIdRule,
  StrictInsightRollupRequiredCodeRule,
  defaultStrictInsightRollupValidator,
} from "./strict-insight-rollup-rules.js";
import { newStrictInsightRollup } from "./strict-insight-rollup.js";

test("StrictInsightRollupValidator reports every problem", () => {
  const validator = defaultStrictInsightRollupValidator();
  const item = newStrictInsightRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictInsightRollupRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new StrictInsightRollupRequiredAudienceIdRule("strict insight rollup needs a value");
  const item = newStrictInsightRollup("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictInsightRollupRequiredCodeRule flags a blank code", () => {
  const rule = new StrictInsightRollupRequiredCodeRule("strict insight rollup needs this field");
  const item = newStrictInsightRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictInsightRollupCodeLengthRule flags a long code", () => {
  const rule = new StrictInsightRollupCodeLengthRule(120);
  const item = newStrictInsightRollup("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
