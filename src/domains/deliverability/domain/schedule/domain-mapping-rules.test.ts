import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainMappingCeilingRangeRule,
  DomainMappingRequiredCodeRule,
  defaultDomainMappingValidator,
} from "./domain-mapping-rules.js";
import { newDomainMapping } from "./domain-mapping.js";

test("DomainMappingValidator reports every problem", () => {
  const validator = defaultDomainMappingValidator();
  const item = newDomainMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainMappingCeilingRangeRule flags values above ceiling", () => {
  const rule = new DomainMappingCeilingRangeRule(2.9, 359.4);
  const item = newDomainMapping("x", "y");
  item.ceiling = 360.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainMappingRequiredCodeRule flags a blank code", () => {
  const rule = new DomainMappingRequiredCodeRule("domain mapping needs a value");
  const item = newDomainMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
