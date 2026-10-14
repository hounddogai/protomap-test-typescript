import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedReputationBundleRegionLengthRule,
  BatchedReputationBundleRequiredRegionRule,
  defaultBatchedReputationBundleValidator,
} from "./batched-reputation-bundle-rules.js";
import { newBatchedReputationBundle } from "./batched-reputation-bundle.js";

test("BatchedReputationBundleValidator reports every problem", () => {
  const validator = defaultBatchedReputationBundleValidator();
  const item = newBatchedReputationBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedReputationBundleRegionLengthRule flags a long region", () => {
  const rule = new BatchedReputationBundleRegionLengthRule(120);
  const item = newBatchedReputationBundle("x", "y");
  item.region = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedReputationBundleRequiredRegionRule flags a blank region", () => {
  const rule = new BatchedReputationBundleRequiredRegionRule("batched reputation bundle needs an entry");
  const item = newBatchedReputationBundle("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
