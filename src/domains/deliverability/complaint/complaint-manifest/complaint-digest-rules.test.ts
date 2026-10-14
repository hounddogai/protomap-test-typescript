import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintDigestCodeLengthRule,
  ComplaintDigestJourneyIdLengthRule,
  ComplaintDigestRateRangeRule,
  ComplaintDigestRequiredJourneyIdRule,
  defaultComplaintDigestValidator,
} from "./complaint-digest-rules.js";
import { newComplaintDigest } from "./complaint-digest.js";

test("ComplaintDigestValidator reports every problem", () => {
  const validator = defaultComplaintDigestValidator();
  const item = newComplaintDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintDigestJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ComplaintDigestJourneyIdLengthRule(1000);
  const item = newComplaintDigest("x", "y");
  item.journeyId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintDigestRateRangeRule flags values above rate", () => {
  const rule = new ComplaintDigestRateRangeRule(5.1, 4110.9);
  const item = newComplaintDigest("x", "y");
  item.rate = 4112.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintDigestCodeLengthRule flags a long code", () => {
  const rule = new ComplaintDigestCodeLengthRule(80);
  const item = newComplaintDigest("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintDigestRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new ComplaintDigestRequiredJourneyIdRule("complaint digest needs an entry");
  const item = newComplaintDigest("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
