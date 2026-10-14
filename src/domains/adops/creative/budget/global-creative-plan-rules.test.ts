import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalCreativePlanChecksumLengthRule,
  GlobalCreativePlanCodeLengthRule,
  GlobalCreativePlanLabelLengthRule,
  GlobalCreativePlanRequiredLabelRule,
  defaultGlobalCreativePlanValidator,
} from "./global-creative-plan-rules.js";
import { newGlobalCreativePlan } from "./global-creative-plan.js";

test("GlobalCreativePlanValidator reports every problem", () => {
  const validator = defaultGlobalCreativePlanValidator();
  const item = newGlobalCreativePlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalCreativePlanCodeLengthRule flags a long code", () => {
  const rule = new GlobalCreativePlanCodeLengthRule(64);
  const item = newGlobalCreativePlan("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalCreativePlanChecksumLengthRule flags a long checksum", () => {
  const rule = new GlobalCreativePlanChecksumLengthRule(64);
  const item = newGlobalCreativePlan("x", "y");
  item.checksum = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalCreativePlanRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalCreativePlanRequiredLabelRule("global creative plan needs a value");
  const item = newGlobalCreativePlan("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalCreativePlanLabelLengthRule flags a long label", () => {
  const rule = new GlobalCreativePlanLabelLengthRule(80);
  const item = newGlobalCreativePlan("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
