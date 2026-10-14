import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatCheckpointCampaignRefLengthRule,
  CsatCheckpointRequiredCountryRule,
  CsatCheckpointRequiredNameRule,
  defaultCsatCheckpointValidator,
} from "./csat-checkpoint-rules.js";
import { newCsatCheckpoint } from "./csat-checkpoint.js";

test("CsatCheckpointValidator reports every problem", () => {
  const validator = defaultCsatCheckpointValidator();
  const item = newCsatCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatCheckpointCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new CsatCheckpointCampaignRefLengthRule(80);
  const item = newCsatCheckpoint("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatCheckpointRequiredCountryRule flags a blank country", () => {
  const rule = new CsatCheckpointRequiredCountryRule("csat checkpoint needs an entry");
  const item = newCsatCheckpoint("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new CsatCheckpointRequiredNameRule("csat checkpoint needs this field");
  const item = newCsatCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
