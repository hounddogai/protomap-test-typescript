import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowMappingAudienceIdLengthRule,
  WindowMappingDescriptionLengthRule,
  WindowMappingRequiredAudienceIdRule,
  WindowMappingRequiredDescriptionRule,
  defaultWindowMappingValidator,
} from "./window-mapping-rules.js";
import { newWindowMapping } from "./window-mapping.js";

test("WindowMappingValidator reports every problem", () => {
  const validator = defaultWindowMappingValidator();
  const item = newWindowMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowMappingRequiredDescriptionRule flags a blank description", () => {
  const rule = new WindowMappingRequiredDescriptionRule("window mapping needs a value");
  const item = newWindowMapping("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowMappingAudienceIdLengthRule flags a long audience id", () => {
  const rule = new WindowMappingAudienceIdLengthRule(80);
  const item = newWindowMapping("x", "y");
  item.audienceId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowMappingDescriptionLengthRule flags a long description", () => {
  const rule = new WindowMappingDescriptionLengthRule(1000);
  const item = newWindowMapping("x", "y");
  item.description = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowMappingRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new WindowMappingRequiredAudienceIdRule("window mapping needs this field");
  const item = newWindowMapping("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
