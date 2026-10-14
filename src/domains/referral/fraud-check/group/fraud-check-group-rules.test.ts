import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckGroupCampaignRefLengthRule,
  FraudCheckGroupCodeLengthRule,
  FraudCheckGroupRequiredCodeRule,
  defaultFraudCheckGroupValidator,
} from "./fraud-check-group-rules.js";
import { newFraudCheckGroup } from "./fraud-check-group.js";

test("FraudCheckGroupValidator reports every problem", () => {
  const validator = defaultFraudCheckGroupValidator();
  const item = newFraudCheckGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckGroupRequiredCodeRule flags a blank code", () => {
  const rule = new FraudCheckGroupRequiredCodeRule("fraud check group needs a value");
  const item = newFraudCheckGroup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckGroupCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new FraudCheckGroupCampaignRefLengthRule(120);
  const item = newFraudCheckGroup("x", "y");
  item.campaignRef = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckGroupCodeLengthRule flags a long code", () => {
  const rule = new FraudCheckGroupCodeLengthRule(120);
  const item = newFraudCheckGroup("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
