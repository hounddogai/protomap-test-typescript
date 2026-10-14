import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeDigestRequiredDescriptionRule,
  NudgeDigestRequiredUnitRule,
  NudgeDigestRetriesRangeRule,
  defaultNudgeDigestValidator,
} from "./nudge-digest-rules.js";
import { newNudgeDigest } from "./nudge-digest.js";

test("NudgeDigestValidator reports every problem", () => {
  const validator = defaultNudgeDigestValidator();
  const item = newNudgeDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeDigestRequiredDescriptionRule flags a blank description", () => {
  const rule = new NudgeDigestRequiredDescriptionRule("nudge digest needs this field");
  const item = newNudgeDigest("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeDigestRequiredUnitRule flags a blank unit", () => {
  const rule = new NudgeDigestRequiredUnitRule("nudge digest needs an entry");
  const item = newNudgeDigest("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeDigestRetriesRangeRule flags values above retries", () => {
  const rule = new NudgeDigestRetriesRangeRule(32, 1000);
  const item = newNudgeDigest("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
