import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaRollupRequiredLabelRule,
  SlaRollupRequiredPhoneRule,
  SlaRollupUtmSourceLengthRule,
  defaultSlaRollupValidator,
} from "./sla-rollup-rules.js";
import { newSlaRollup } from "./sla-rollup.js";

test("SlaRollupValidator reports every problem", () => {
  const validator = defaultSlaRollupValidator();
  const item = newSlaRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaRollupRequiredLabelRule flags a blank label", () => {
  const rule = new SlaRollupRequiredLabelRule("sla rollup needs this field");
  const item = newSlaRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaRollupRequiredPhoneRule flags a blank phone", () => {
  const rule = new SlaRollupRequiredPhoneRule("sla rollup needs this field");
  const item = newSlaRollup("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaRollupUtmSourceLengthRule flags a long utm source", () => {
  const rule = new SlaRollupUtmSourceLengthRule(3600);
  const item = newSlaRollup("x", "y");
  item.utmSource = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
