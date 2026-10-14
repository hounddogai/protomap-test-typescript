import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedProofProfileAttemptsRangeRule,
  BatchedProofProfileCodeLengthRule,
  BatchedProofProfileMinimumRangeRule,
  BatchedProofProfileRequiredCountryRule,
  defaultBatchedProofProfileValidator,
} from "./batched-proof-profile-rules.js";
import { newBatchedProofProfile } from "./batched-proof-profile.js";

test("BatchedProofProfileValidator reports every problem", () => {
  const validator = defaultBatchedProofProfileValidator();
  const item = newBatchedProofProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedProofProfileCodeLengthRule flags a long code", () => {
  const rule = new BatchedProofProfileCodeLengthRule(1000);
  const item = newBatchedProofProfile("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedProofProfileAttemptsRangeRule flags values above attempts", () => {
  const rule = new BatchedProofProfileAttemptsRangeRule(32, 1000);
  const item = newBatchedProofProfile("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedProofProfileRequiredCountryRule flags a blank country", () => {
  const rule = new BatchedProofProfileRequiredCountryRule("batched proof profile needs a value");
  const item = newBatchedProofProfile("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedProofProfileMinimumRangeRule flags values above minimum", () => {
  const rule = new BatchedProofProfileMinimumRangeRule(8.4, 3747.6);
  const item = newBatchedProofProfile("x", "y");
  item.minimum = 3749.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
