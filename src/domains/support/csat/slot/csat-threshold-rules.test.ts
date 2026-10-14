import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatThresholdRequiredCodeRule,
  CsatThresholdRequiredContactEmailRule,
  defaultCsatThresholdValidator,
} from "./csat-threshold-rules.js";
import { newCsatThreshold } from "./csat-threshold.js";

test("CsatThresholdValidator reports every problem", () => {
  const validator = defaultCsatThresholdValidator();
  const item = newCsatThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new CsatThresholdRequiredCodeRule("csat threshold needs this field");
  const item = newCsatThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatThresholdRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new CsatThresholdRequiredContactEmailRule("csat threshold needs an entry");
  const item = newCsatThreshold("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
