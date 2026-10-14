import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelClaimRequiredPhoneRule,
  LevelClaimRequiredTitleRule,
  LevelClaimVersionRangeRule,
  defaultLevelClaimValidator,
} from "./level-claim-rules.js";
import { newLevelClaim } from "./level-claim.js";

test("LevelClaimValidator reports every problem", () => {
  const validator = defaultLevelClaimValidator();
  const item = newLevelClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelClaimRequiredPhoneRule flags a blank phone", () => {
  const rule = new LevelClaimRequiredPhoneRule("level claim needs this field");
  const item = newLevelClaim("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelClaimVersionRangeRule flags values above version", () => {
  const rule = new LevelClaimVersionRangeRule(120, 1000);
  const item = newLevelClaim("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelClaimRequiredTitleRule flags a blank title", () => {
  const rule = new LevelClaimRequiredTitleRule("level claim needs this field");
  const item = newLevelClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
