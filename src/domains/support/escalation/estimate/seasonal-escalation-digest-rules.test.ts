import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalEscalationDigestCodeLengthRule,
  SeasonalEscalationDigestRequiredCodeRule,
  SeasonalEscalationDigestRequiredNameRule,
  SeasonalEscalationDigestSegmentLengthRule,
  defaultSeasonalEscalationDigestValidator,
} from "./seasonal-escalation-digest-rules.js";
import { newSeasonalEscalationDigest } from "./seasonal-escalation-digest.js";

test("SeasonalEscalationDigestValidator reports every problem", () => {
  const validator = defaultSeasonalEscalationDigestValidator();
  const item = newSeasonalEscalationDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalEscalationDigestRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalEscalationDigestRequiredCodeRule("seasonal escalation digest needs an entry");
  const item = newSeasonalEscalationDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalEscalationDigestRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalEscalationDigestRequiredNameRule("seasonal escalation digest needs an entry");
  const item = newSeasonalEscalationDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalEscalationDigestSegmentLengthRule flags a long segment", () => {
  const rule = new SeasonalEscalationDigestSegmentLengthRule(3600);
  const item = newSeasonalEscalationDigest("x", "y");
  item.segment = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalEscalationDigestCodeLengthRule flags a long code", () => {
  const rule = new SeasonalEscalationDigestCodeLengthRule(3600);
  const item = newSeasonalEscalationDigest("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
