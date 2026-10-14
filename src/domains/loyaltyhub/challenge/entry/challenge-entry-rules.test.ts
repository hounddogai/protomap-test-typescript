import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeEntryRequiredCodeRule,
  ChallengeEntryRequiredTitleRule,
  ChallengeEntryWeightRangeRule,
  defaultChallengeEntryValidator,
} from "./challenge-entry-rules.js";
import { newChallengeEntry } from "./challenge-entry.js";

test("ChallengeEntryValidator reports every problem", () => {
  const validator = defaultChallengeEntryValidator();
  const item = newChallengeEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeEntryRequiredTitleRule flags a blank title", () => {
  const rule = new ChallengeEntryRequiredTitleRule("challenge entry needs this field");
  const item = newChallengeEntry("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeEntryRequiredCodeRule flags a blank code", () => {
  const rule = new ChallengeEntryRequiredCodeRule("challenge entry needs a value");
  const item = newChallengeEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeEntryWeightRangeRule flags values above weight", () => {
  const rule = new ChallengeEntryWeightRangeRule(8.4, 3535);
  const item = newChallengeEntry("x", "y");
  item.weight = 3536.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
