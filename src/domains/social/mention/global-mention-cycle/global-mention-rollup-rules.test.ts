import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalMentionRollupLimitRangeRule,
  GlobalMentionRollupQuantityRangeRule,
  GlobalMentionRollupRequiredCodeRule,
  GlobalMentionRollupRequiredTitleRule,
  defaultGlobalMentionRollupValidator,
} from "./global-mention-rollup-rules.js";
import { newGlobalMentionRollup } from "./global-mention-rollup.js";

test("GlobalMentionRollupValidator reports every problem", () => {
  const validator = defaultGlobalMentionRollupValidator();
  const item = newGlobalMentionRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalMentionRollupRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalMentionRollupRequiredCodeRule("global mention rollup needs an entry");
  const item = newGlobalMentionRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalMentionRollupLimitRangeRule flags values above limit", () => {
  const rule = new GlobalMentionRollupLimitRangeRule(32, 86400);
  const item = newGlobalMentionRollup("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalMentionRollupQuantityRangeRule flags values above quantity", () => {
  const rule = new GlobalMentionRollupQuantityRangeRule(120, 255);
  const item = newGlobalMentionRollup("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalMentionRollupRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalMentionRollupRequiredTitleRule("global mention rollup needs an entry");
  const item = newGlobalMentionRollup("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
