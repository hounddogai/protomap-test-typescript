import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryFunnelTargetAmountRangeRule,
  PrimaryFunnelTargetRequiredCodeRule,
  PrimaryFunnelTargetRequiredOwnerIdRule,
  PrimaryFunnelTargetRequiredSourceRule,
  defaultPrimaryFunnelTargetValidator,
} from "./primary-funnel-target-rules.js";
import { newPrimaryFunnelTarget } from "./primary-funnel-target.js";

test("PrimaryFunnelTargetValidator reports every problem", () => {
  const validator = defaultPrimaryFunnelTargetValidator();
  const item = newPrimaryFunnelTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryFunnelTargetRequiredSourceRule flags a blank source", () => {
  const rule = new PrimaryFunnelTargetRequiredSourceRule("primary funnel target needs this field");
  const item = newPrimaryFunnelTarget("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryFunnelTargetAmountRangeRule flags values above amount", () => {
  const rule = new PrimaryFunnelTargetAmountRangeRule(2.4, 3400);
  const item = newPrimaryFunnelTarget("x", "y");
  item.amount = 3401.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryFunnelTargetRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new PrimaryFunnelTargetRequiredOwnerIdRule("primary funnel target needs an entry");
  const item = newPrimaryFunnelTarget("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryFunnelTargetRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryFunnelTargetRequiredCodeRule("primary funnel target needs an entry");
  const item = newPrimaryFunnelTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
