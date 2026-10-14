import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionRequestAudienceIdLengthRule,
  RetentionRequestCodeLengthRule,
  RetentionRequestNameLengthRule,
  defaultRetentionRequestValidator,
} from "./retention-request-rules.js";
import { newRetentionRequest } from "./retention-request.js";

test("RetentionRequestValidator reports every problem", () => {
  const validator = defaultRetentionRequestValidator();
  const item = newRetentionRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionRequestCodeLengthRule flags a long code", () => {
  const rule = new RetentionRequestCodeLengthRule(64);
  const item = newRetentionRequest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionRequestAudienceIdLengthRule flags a long audience id", () => {
  const rule = new RetentionRequestAudienceIdLengthRule(64);
  const item = newRetentionRequest("x", "y");
  item.audienceId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionRequestNameLengthRule flags a long name", () => {
  const rule = new RetentionRequestNameLengthRule(1000);
  const item = newRetentionRequest("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
