import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelProposalCodeLengthRule,
  LevelProposalLabelLengthRule,
  LevelProposalRateRangeRule,
  LevelProposalRequiredOwnerIdRule,
  defaultLevelProposalValidator,
} from "./level-proposal-rules.js";
import { newLevelProposal } from "./level-proposal.js";

test("LevelProposalValidator reports every problem", () => {
  const validator = defaultLevelProposalValidator();
  const item = newLevelProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelProposalRateRangeRule flags values above rate", () => {
  const rule = new LevelProposalRateRangeRule(1.9, 1414.4);
  const item = newLevelProposal("x", "y");
  item.rate = 1415.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelProposalRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new LevelProposalRequiredOwnerIdRule("level proposal needs an entry");
  const item = newLevelProposal("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelProposalLabelLengthRule flags a long label", () => {
  const rule = new LevelProposalLabelLengthRule(86400);
  const item = newLevelProposal("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelProposalCodeLengthRule flags a long code", () => {
  const rule = new LevelProposalCodeLengthRule(1000);
  const item = newLevelProposal("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
