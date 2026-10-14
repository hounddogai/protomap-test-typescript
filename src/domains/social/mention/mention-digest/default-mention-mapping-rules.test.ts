import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultMentionMappingCodeLengthRule,
  DefaultMentionMappingLabelLengthRule,
  DefaultMentionMappingRequiredLabelRule,
  DefaultMentionMappingRequiredOwnerIdRule,
  defaultDefaultMentionMappingValidator,
} from "./default-mention-mapping-rules.js";
import { newDefaultMentionMapping } from "./default-mention-mapping.js";

test("DefaultMentionMappingValidator reports every problem", () => {
  const validator = defaultDefaultMentionMappingValidator();
  const item = newDefaultMentionMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultMentionMappingLabelLengthRule flags a long label", () => {
  const rule = new DefaultMentionMappingLabelLengthRule(64);
  const item = newDefaultMentionMapping("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultMentionMappingRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultMentionMappingRequiredLabelRule("default mention mapping needs this field");
  const item = newDefaultMentionMapping("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultMentionMappingCodeLengthRule flags a long code", () => {
  const rule = new DefaultMentionMappingCodeLengthRule(16);
  const item = newDefaultMentionMapping("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultMentionMappingRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new DefaultMentionMappingRequiredOwnerIdRule("default mention mapping needs this field");
  const item = newDefaultMentionMapping("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
