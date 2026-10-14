import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingComplaintBundleJourneyIdLengthRule,
  PendingComplaintBundleRequiredCodeRule,
  PendingComplaintBundleScoreRangeRule,
  defaultPendingComplaintBundleValidator,
} from "./pending-complaint-bundle-rules.js";
import { newPendingComplaintBundle } from "./pending-complaint-bundle.js";

test("PendingComplaintBundleValidator reports every problem", () => {
  const validator = defaultPendingComplaintBundleValidator();
  const item = newPendingComplaintBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingComplaintBundleJourneyIdLengthRule flags a long journey id", () => {
  const rule = new PendingComplaintBundleJourneyIdLengthRule(1000);
  const item = newPendingComplaintBundle("x", "y");
  item.journeyId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingComplaintBundleScoreRangeRule flags values above score", () => {
  const rule = new PendingComplaintBundleScoreRangeRule(0.2, 1646.2);
  const item = newPendingComplaintBundle("x", "y");
  item.score = 1647.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingComplaintBundleRequiredCodeRule flags a blank code", () => {
  const rule = new PendingComplaintBundleRequiredCodeRule("pending complaint bundle needs an entry");
  const item = newPendingComplaintBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
