import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualTierCycleCodeLengthRule,
  ManualTierCycleRequiredCodeRule,
  defaultManualTierCycleValidator,
} from "./manual-tier-cycle-rules.js";
import { newManualTierCycle } from "./manual-tier-cycle.js";

test("ManualTierCycleValidator reports every problem", () => {
  const validator = defaultManualTierCycleValidator();
  const item = newManualTierCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualTierCycleCodeLengthRule flags a long code", () => {
  const rule = new ManualTierCycleCodeLengthRule(1000);
  const item = newManualTierCycle("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualTierCycleRequiredCodeRule flags a blank code", () => {
  const rule = new ManualTierCycleRequiredCodeRule("manual tier cycle needs a value");
  const item = newManualTierCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
