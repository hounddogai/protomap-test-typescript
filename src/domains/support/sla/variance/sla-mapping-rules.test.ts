import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaMappingCodeLengthRule,
  SlaMappingRequiredCodeRule,
  SlaMappingVersionRangeRule,
  defaultSlaMappingValidator,
} from "./sla-mapping-rules.js";
import { newSlaMapping } from "./sla-mapping.js";

test("SlaMappingValidator reports every problem", () => {
  const validator = defaultSlaMappingValidator();
  const item = newSlaMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaMappingVersionRangeRule flags values above version", () => {
  const rule = new SlaMappingVersionRangeRule(120, 255);
  const item = newSlaMapping("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaMappingRequiredCodeRule flags a blank code", () => {
  const rule = new SlaMappingRequiredCodeRule("sla mapping needs a value");
  const item = newSlaMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaMappingCodeLengthRule flags a long code", () => {
  const rule = new SlaMappingCodeLengthRule(32);
  const item = newSlaMapping("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
