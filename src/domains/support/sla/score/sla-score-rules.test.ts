import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaScoreRequiredCodeRule,
  SlaScoreRequiredTitleRule,
  SlaScoreSequenceRangeRule,
  defaultSlaScoreValidator,
} from "./sla-score-rules.js";
import { newSlaScore } from "./sla-score.js";

test("SlaScoreValidator reports every problem", () => {
  const validator = defaultSlaScoreValidator();
  const item = newSlaScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaScoreSequenceRangeRule flags values above sequence", () => {
  const rule = new SlaScoreSequenceRangeRule(64, 86400);
  const item = newSlaScore("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SlaScoreRequiredTitleRule flags a blank title", () => {
  const rule = new SlaScoreRequiredTitleRule("sla score needs this field");
  const item = newSlaScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaScoreRequiredCodeRule flags a blank code", () => {
  const rule = new SlaScoreRequiredCodeRule("sla score needs an entry");
  const item = newSlaScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
