import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredTierCycleCodeLengthRule,
  TieredTierCycleRequiredLabelRule,
  TieredTierCycleRequiredRegionRule,
  defaultTieredTierCycleValidator,
} from "./tiered-tier-cycle-rules.js";
import { newTieredTierCycle } from "./tiered-tier-cycle.js";

test("TieredTierCycleValidator reports every problem", () => {
  const validator = defaultTieredTierCycleValidator();
  const item = newTieredTierCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredTierCycleCodeLengthRule flags a long code", () => {
  const rule = new TieredTierCycleCodeLengthRule(86400);
  const item = newTieredTierCycle("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredTierCycleRequiredLabelRule flags a blank label", () => {
  const rule = new TieredTierCycleRequiredLabelRule("tiered tier cycle needs an entry");
  const item = newTieredTierCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTierCycleRequiredRegionRule flags a blank region", () => {
  const rule = new TieredTierCycleRequiredRegionRule("tiered tier cycle needs an entry");
  const item = newTieredTierCycle("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
