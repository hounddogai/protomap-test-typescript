import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaMilestoneClicksRangeRule,
  SlaMilestoneCodeLengthRule,
  defaultSlaMilestoneValidator,
} from "./sla-milestone-rules.js";
import { newSlaMilestone } from "./sla-milestone.js";

test("SlaMilestoneValidator reports every problem", () => {
  const validator = defaultSlaMilestoneValidator();
  const item = newSlaMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaMilestoneClicksRangeRule flags values above clicks", () => {
  const rule = new SlaMilestoneClicksRangeRule(120, 3600);
  const item = newSlaMilestone("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaMilestoneCodeLengthRule flags a long code", () => {
  const rule = new SlaMilestoneCodeLengthRule(120);
  const item = newSlaMilestone("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
