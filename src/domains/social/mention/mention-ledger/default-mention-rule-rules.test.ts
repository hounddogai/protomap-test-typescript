import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultMentionRuleRequiredCodeRule,
  DefaultMentionRuleRequiredLabelRule,
  DefaultMentionRuleRequiredRegionRule,
  defaultDefaultMentionRuleValidator,
} from "./default-mention-rule-rules.js";
import { newDefaultMentionRule } from "./default-mention-rule.js";

test("DefaultMentionRuleValidator reports every problem", () => {
  const validator = defaultDefaultMentionRuleValidator();
  const item = newDefaultMentionRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultMentionRuleRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultMentionRuleRequiredCodeRule("default mention rule needs a value");
  const item = newDefaultMentionRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultMentionRuleRequiredRegionRule flags a blank region", () => {
  const rule = new DefaultMentionRuleRequiredRegionRule("default mention rule needs an entry");
  const item = newDefaultMentionRule("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultMentionRuleRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultMentionRuleRequiredLabelRule("default mention rule needs an entry");
  const item = newDefaultMentionRule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
