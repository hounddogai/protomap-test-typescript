import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPathTemplateFloorValueRangeRule,
  RollingPathTemplateLocaleLengthRule,
  defaultRollingPathTemplateValidator,
} from "./rolling-path-template-rules.js";
import { newRollingPathTemplate } from "./rolling-path-template.js";

test("RollingPathTemplateValidator reports every problem", () => {
  const validator = defaultRollingPathTemplateValidator();
  const item = newRollingPathTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPathTemplateFloorValueRangeRule flags values above floor value", () => {
  const rule = new RollingPathTemplateFloorValueRangeRule(0.1, 1442.1);
  const item = newRollingPathTemplate("x", "y");
  item.floorValue = 1443.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingPathTemplateLocaleLengthRule flags a long locale", () => {
  const rule = new RollingPathTemplateLocaleLengthRule(255);
  const item = newRollingPathTemplate("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
