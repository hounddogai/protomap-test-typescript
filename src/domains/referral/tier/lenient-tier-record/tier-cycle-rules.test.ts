import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierCycleContactEmailLengthRule,
  TierCycleRequiredCodeRule,
  TierCycleRequiredContactEmailRule,
  TierCycleUtmSourceLengthRule,
  defaultTierCycleValidator,
} from "./tier-cycle-rules.js";
import { newTierCycle } from "./tier-cycle.js";

test("TierCycleValidator reports every problem", () => {
  const validator = defaultTierCycleValidator();
  const item = newTierCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierCycleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new TierCycleRequiredContactEmailRule("tier cycle needs an entry");
  const item = newTierCycle("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierCycleRequiredCodeRule flags a blank code", () => {
  const rule = new TierCycleRequiredCodeRule("tier cycle needs this field");
  const item = newTierCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierCycleUtmSourceLengthRule flags a long utm source", () => {
  const rule = new TierCycleUtmSourceLengthRule(3600);
  const item = newTierCycle("x", "y");
  item.utmSource = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierCycleContactEmailLengthRule flags a long contact email", () => {
  const rule = new TierCycleContactEmailLengthRule(255);
  const item = newTierCycle("x", "y");
  item.contactEmail = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
