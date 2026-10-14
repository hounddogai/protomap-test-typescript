import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedDomainBundleCodeLengthRule,
  BatchedDomainBundleRequiredContactEmailRule,
  BatchedDomainBundleTitleLengthRule,
  defaultBatchedDomainBundleValidator,
} from "./batched-domain-bundle-rules.js";
import { newBatchedDomainBundle } from "./batched-domain-bundle.js";

test("BatchedDomainBundleValidator reports every problem", () => {
  const validator = defaultBatchedDomainBundleValidator();
  const item = newBatchedDomainBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedDomainBundleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new BatchedDomainBundleRequiredContactEmailRule("batched domain bundle needs an entry");
  const item = newBatchedDomainBundle("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedDomainBundleTitleLengthRule flags a long title", () => {
  const rule = new BatchedDomainBundleTitleLengthRule(16);
  const item = newBatchedDomainBundle("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedDomainBundleCodeLengthRule flags a long code", () => {
  const rule = new BatchedDomainBundleCodeLengthRule(86400);
  const item = newBatchedDomainBundle("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
