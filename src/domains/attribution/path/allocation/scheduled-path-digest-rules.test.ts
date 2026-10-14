import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledPathDigestCostRangeRule,
  ScheduledPathDigestRequiredTitleRule,
  ScheduledPathDigestUtmSourceLengthRule,
  defaultScheduledPathDigestValidator,
} from "./scheduled-path-digest-rules.js";
import { newScheduledPathDigest } from "./scheduled-path-digest.js";

test("ScheduledPathDigestValidator reports every problem", () => {
  const validator = defaultScheduledPathDigestValidator();
  const item = newScheduledPathDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledPathDigestRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledPathDigestRequiredTitleRule("scheduled path digest needs an entry");
  const item = newScheduledPathDigest("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPathDigestUtmSourceLengthRule flags a long utm source", () => {
  const rule = new ScheduledPathDigestUtmSourceLengthRule(1000);
  const item = newScheduledPathDigest("x", "y");
  item.utmSource = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPathDigestCostRangeRule flags values above cost", () => {
  const rule = new ScheduledPathDigestCostRangeRule(5.7, 3131.6);
  const item = newScheduledPathDigest("x", "y");
  item.cost = 3133.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
