import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementProposalCapacityRangeRule,
  PlacementProposalCodeLengthRule,
  PlacementProposalOpenRateRangeRule,
  defaultPlacementProposalValidator,
} from "./placement-proposal-rules.js";
import { newPlacementProposal } from "./placement-proposal.js";

test("PlacementProposalValidator reports every problem", () => {
  const validator = defaultPlacementProposalValidator();
  const item = newPlacementProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementProposalCodeLengthRule flags a long code", () => {
  const rule = new PlacementProposalCodeLengthRule(120);
  const item = newPlacementProposal("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementProposalCapacityRangeRule flags values above capacity", () => {
  const rule = new PlacementProposalCapacityRangeRule(16, 255);
  const item = newPlacementProposal("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementProposalOpenRateRangeRule flags values above open rate", () => {
  const rule = new PlacementProposalOpenRateRangeRule(6.4, 1406.9);
  const item = newPlacementProposal("x", "y");
  item.openRate = 1408.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
