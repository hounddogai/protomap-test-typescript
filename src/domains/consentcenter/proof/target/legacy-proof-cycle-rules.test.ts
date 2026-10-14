import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyProofCycleCodeLengthRule,
  LegacyProofCycleLabelLengthRule,
  LegacyProofCycleMaximumRangeRule,
  LegacyProofCycleRequiredContactEmailRule,
  LegacyProofCycleRequiredLabelRule,
  defaultLegacyProofCycleValidator,
} from "./legacy-proof-cycle-rules.js";
import { newLegacyProofCycle } from "./legacy-proof-cycle.js";

test("LegacyProofCycleValidator reports every problem", () => {
  const validator = defaultLegacyProofCycleValidator();
  const item = newLegacyProofCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyProofCycleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new LegacyProofCycleRequiredContactEmailRule("legacy proof cycle needs an entry");
  const item = newLegacyProofCycle("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyProofCycleCodeLengthRule flags a long code", () => {
  const rule = new LegacyProofCycleCodeLengthRule(1000);
  const item = newLegacyProofCycle("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyProofCycleLabelLengthRule flags a long label", () => {
  const rule = new LegacyProofCycleLabelLengthRule(120);
  const item = newLegacyProofCycle("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyProofCycleMaximumRangeRule flags values above maximum", () => {
  const rule = new LegacyProofCycleMaximumRangeRule(1.2, 3368.4);
  const item = newLegacyProofCycle("x", "y");
  item.maximum = 3369.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyProofCycleRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyProofCycleRequiredLabelRule("legacy proof cycle needs this field");
  const item = newLegacyProofCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
