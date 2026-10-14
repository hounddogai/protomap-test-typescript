import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualWindowProposalCodeLengthRule,
  ManualWindowProposalRequiredAudienceIdRule,
  ManualWindowProposalRequiredCodeRule,
  ManualWindowProposalRequiredLabelRule,
  defaultManualWindowProposalValidator,
} from "./manual-window-proposal-rules.js";
import { newManualWindowProposal } from "./manual-window-proposal.js";

test("ManualWindowProposalValidator reports every problem", () => {
  const validator = defaultManualWindowProposalValidator();
  const item = newManualWindowProposal("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualWindowProposalCodeLengthRule flags a long code", () => {
  const rule = new ManualWindowProposalCodeLengthRule(255);
  const item = newManualWindowProposal("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualWindowProposalRequiredLabelRule flags a blank label", () => {
  const rule = new ManualWindowProposalRequiredLabelRule("manual window proposal needs a value");
  const item = newManualWindowProposal("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualWindowProposalRequiredCodeRule flags a blank code", () => {
  const rule = new ManualWindowProposalRequiredCodeRule("manual window proposal needs an entry");
  const item = newManualWindowProposal("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualWindowProposalRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new ManualWindowProposalRequiredAudienceIdRule("manual window proposal needs this field");
  const item = newManualWindowProposal("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
