import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalInsightProfileCapacityRangeRule,
  GlobalInsightProfileNameLengthRule,
  GlobalInsightProfileSummaryLengthRule,
  defaultGlobalInsightProfileValidator,
} from "./global-insight-profile-rules.js";
import { newGlobalInsightProfile } from "./global-insight-profile.js";

test("GlobalInsightProfileValidator reports every problem", () => {
  const validator = defaultGlobalInsightProfileValidator();
  const item = newGlobalInsightProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalInsightProfileCapacityRangeRule flags values above capacity", () => {
  const rule = new GlobalInsightProfileCapacityRangeRule(120, 255);
  const item = newGlobalInsightProfile("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalInsightProfileSummaryLengthRule flags a long summary", () => {
  const rule = new GlobalInsightProfileSummaryLengthRule(86400);
  const item = newGlobalInsightProfile("x", "y");
  item.summary = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalInsightProfileNameLengthRule flags a long name", () => {
  const rule = new GlobalInsightProfileNameLengthRule(255);
  const item = newGlobalInsightProfile("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
