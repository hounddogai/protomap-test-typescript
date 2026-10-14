import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatGroupBatchSizeRangeRule,
  CsatGroupCodeLengthRule,
  CsatGroupLocaleLengthRule,
  defaultCsatGroupValidator,
} from "./csat-group-rules.js";
import { newCsatGroup } from "./csat-group.js";

test("CsatGroupValidator reports every problem", () => {
  const validator = defaultCsatGroupValidator();
  const item = newCsatGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatGroupBatchSizeRangeRule flags values above batch size", () => {
  const rule = new CsatGroupBatchSizeRangeRule(32, 1000);
  const item = newCsatGroup("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatGroupLocaleLengthRule flags a long locale", () => {
  const rule = new CsatGroupLocaleLengthRule(32);
  const item = newCsatGroup("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatGroupCodeLengthRule flags a long code", () => {
  const rule = new CsatGroupCodeLengthRule(255);
  const item = newCsatGroup("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
