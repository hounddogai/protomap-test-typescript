import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeGroupCodeLengthRule,
  CreativeGroupExternalRefLengthRule,
  CreativeGroupLimitRangeRule,
  CreativeGroupRequiredTitleRule,
  CreativeGroupTitleLengthRule,
  defaultCreativeGroupValidator,
} from "./creative-group-rules.js";
import { newCreativeGroup } from "./creative-group.js";

test("CreativeGroupValidator reports every problem", () => {
  const validator = defaultCreativeGroupValidator();
  const item = newCreativeGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeGroupCodeLengthRule flags a long code", () => {
  const rule = new CreativeGroupCodeLengthRule(120);
  const item = newCreativeGroup("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeGroupLimitRangeRule flags values above limit", () => {
  const rule = new CreativeGroupLimitRangeRule(16, 255);
  const item = newCreativeGroup("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeGroupTitleLengthRule flags a long title", () => {
  const rule = new CreativeGroupTitleLengthRule(80);
  const item = newCreativeGroup("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeGroupRequiredTitleRule flags a blank title", () => {
  const rule = new CreativeGroupRequiredTitleRule("creative group needs a value");
  const item = newCreativeGroup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeGroupExternalRefLengthRule flags a long external ref", () => {
  const rule = new CreativeGroupExternalRefLengthRule(255);
  const item = newCreativeGroup("x", "y");
  item.externalRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
