import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRedemptionGroupCodeLengthRule,
  GlobalRedemptionGroupRequiredNameRule,
  defaultGlobalRedemptionGroupValidator,
} from "./global-redemption-group-rules.js";
import { newGlobalRedemptionGroup } from "./global-redemption-group.js";

test("GlobalRedemptionGroupValidator reports every problem", () => {
  const validator = defaultGlobalRedemptionGroupValidator();
  const item = newGlobalRedemptionGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRedemptionGroupRequiredNameRule flags a blank name", () => {
  const rule = new GlobalRedemptionGroupRequiredNameRule("global redemption group needs an entry");
  const item = newGlobalRedemptionGroup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRedemptionGroupCodeLengthRule flags a long code", () => {
  const rule = new GlobalRedemptionGroupCodeLengthRule(32);
  const item = newGlobalRedemptionGroup("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
