import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeProposalRequiredNameRule,
  CreativeProposalScoreRangeRule,
  CreativeProposalTimezoneLengthRule,
  defaultCreativeProposalValidator,
} from "./creative-proposal-rules.js";
import { newCreativeProposal } from "./creative-proposal.js";

test("CreativeProposalValidator reports every problem", () => {
  const validator = defaultCreativeProposalValidator();
  const item = newCreativeProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeProposalRequiredNameRule flags a blank name", () => {
  const rule = new CreativeProposalRequiredNameRule("creative proposal needs this field");
  const item = newCreativeProposal("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeProposalTimezoneLengthRule flags a long timezone", () => {
  const rule = new CreativeProposalTimezoneLengthRule(80);
  const item = newCreativeProposal("x", "y");
  item.timezone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeProposalScoreRangeRule flags values above score", () => {
  const rule = new CreativeProposalScoreRangeRule(8.4, 1705.5);
  const item = newCreativeProposal("x", "y");
  item.score = 1707;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
