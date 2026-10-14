import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalInviteTargetLabelLengthRule,
  RegionalInviteTargetRequiredCodeRule,
  RegionalInviteTargetScoreRangeRule,
  defaultRegionalInviteTargetValidator,
} from "./regional-invite-target-rules.js";
import { newRegionalInviteTarget } from "./regional-invite-target.js";

test("RegionalInviteTargetValidator reports every problem", () => {
  const validator = defaultRegionalInviteTargetValidator();
  const item = newRegionalInviteTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalInviteTargetRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalInviteTargetRequiredCodeRule("regional invite target needs a value");
  const item = newRegionalInviteTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalInviteTargetLabelLengthRule flags a long label", () => {
  const rule = new RegionalInviteTargetLabelLengthRule(16);
  const item = newRegionalInviteTarget("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalInviteTargetScoreRangeRule flags values above score", () => {
  const rule = new RegionalInviteTargetScoreRangeRule(2.8, 3447.5);
  const item = newRegionalInviteTarget("x", "y");
  item.score = 3449;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
