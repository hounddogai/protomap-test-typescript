import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictExitRuleDraftCodeLengthRule,
  StrictExitRuleDraftRateRangeRule,
  StrictExitRuleDraftRequiredLabelRule,
  StrictExitRuleDraftRequiredTitleRule,
  StrictExitRuleDraftVersionRangeRule,
  defaultStrictExitRuleDraftValidator,
} from "./strict-exit-rule-draft-rules.js";
import { newStrictExitRuleDraft } from "./strict-exit-rule-draft.js";

test("StrictExitRuleDraftValidator reports every problem", () => {
  const validator = defaultStrictExitRuleDraftValidator();
  const item = newStrictExitRuleDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictExitRuleDraftVersionRangeRule flags values above version", () => {
  const rule = new StrictExitRuleDraftVersionRangeRule(64, 120);
  const item = newStrictExitRuleDraft("x", "y");
  item.version = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictExitRuleDraftRequiredLabelRule flags a blank label", () => {
  const rule = new StrictExitRuleDraftRequiredLabelRule("strict exit rule draft needs an entry");
  const item = newStrictExitRuleDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictExitRuleDraftRequiredTitleRule flags a blank title", () => {
  const rule = new StrictExitRuleDraftRequiredTitleRule("strict exit rule draft needs a value");
  const item = newStrictExitRuleDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictExitRuleDraftCodeLengthRule flags a long code", () => {
  const rule = new StrictExitRuleDraftCodeLengthRule(1000);
  const item = newStrictExitRuleDraft("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictExitRuleDraftRateRangeRule flags values above rate", () => {
  const rule = new StrictExitRuleDraftRateRangeRule(7.8, 683.1);
  const item = newStrictExitRuleDraft("x", "y");
  item.rate = 684.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
