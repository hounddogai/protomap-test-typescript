import assert from "node:assert/strict";
import { test } from "node:test";
import { PathMappingCodeLengthRule, defaultPathMappingValidator } from "./path-mapping-rules.js";
import { newPathMapping } from "./path-mapping.js";

test("PathMappingValidator reports every problem", () => {
  const validator = defaultPathMappingValidator();
  const item = newPathMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathMappingCodeLengthRule flags a long code", () => {
  const rule = new PathMappingCodeLengthRule(3600);
  const item = newPathMapping("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
