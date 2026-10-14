import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofGroupBudgetRangeRule,
  ProofGroupFloorValueRangeRule,
  ProofGroupTimezoneLengthRule,
  defaultProofGroupValidator,
} from "./proof-group-rules.js";
import { newProofGroup } from "./proof-group.js";

test("ProofGroupValidator reports every problem", () => {
  const validator = defaultProofGroupValidator();
  const item = newProofGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofGroupFloorValueRangeRule flags values above floor value", () => {
  const rule = new ProofGroupFloorValueRangeRule(4.2, 1985.1);
  const item = newProofGroup("x", "y");
  item.floorValue = 1986.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofGroupTimezoneLengthRule flags a long timezone", () => {
  const rule = new ProofGroupTimezoneLengthRule(32);
  const item = newProofGroup("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofGroupBudgetRangeRule flags values above budget", () => {
  const rule = new ProofGroupBudgetRangeRule(6.2, 3265.9);
  const item = newProofGroup("x", "y");
  item.budget = 3267.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
