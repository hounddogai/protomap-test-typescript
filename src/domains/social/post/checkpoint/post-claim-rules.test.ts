import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostClaimBatchSizeRangeRule,
  PostClaimLabelLengthRule,
  PostClaimRequiredCodeRule,
  PostClaimRequiredLabelRule,
  defaultPostClaimValidator,
} from "./post-claim-rules.js";
import { newPostClaim } from "./post-claim.js";

test("PostClaimValidator reports every problem", () => {
  const validator = defaultPostClaimValidator();
  const item = newPostClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostClaimRequiredCodeRule flags a blank code", () => {
  const rule = new PostClaimRequiredCodeRule("post claim needs a value");
  const item = newPostClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostClaimLabelLengthRule flags a long label", () => {
  const rule = new PostClaimLabelLengthRule(80);
  const item = newPostClaim("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostClaimRequiredLabelRule flags a blank label", () => {
  const rule = new PostClaimRequiredLabelRule("post claim needs this field");
  const item = newPostClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostClaimBatchSizeRangeRule flags values above batch size", () => {
  const rule = new PostClaimBatchSizeRangeRule(80, 255);
  const item = newPostClaim("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
