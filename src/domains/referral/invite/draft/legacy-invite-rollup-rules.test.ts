import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyInviteRollupLabelLengthRule,
  LegacyInviteRollupRequiredAudienceIdRule,
  LegacyInviteRollupRequiredCodeRule,
  LegacyInviteRollupWindowDaysRangeRule,
  defaultLegacyInviteRollupValidator,
} from "./legacy-invite-rollup-rules.js";
import { newLegacyInviteRollup } from "./legacy-invite-rollup.js";

test("LegacyInviteRollupValidator reports every problem", () => {
  const validator = defaultLegacyInviteRollupValidator();
  const item = newLegacyInviteRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyInviteRollupWindowDaysRangeRule flags values above window days", () => {
  const rule = new LegacyInviteRollupWindowDaysRangeRule(32, 255);
  const item = newLegacyInviteRollup("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyInviteRollupRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new LegacyInviteRollupRequiredAudienceIdRule("legacy invite rollup needs this field");
  const item = newLegacyInviteRollup("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyInviteRollupRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyInviteRollupRequiredCodeRule("legacy invite rollup needs an entry");
  const item = newLegacyInviteRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyInviteRollupLabelLengthRule flags a long label", () => {
  const rule = new LegacyInviteRollupLabelLengthRule(3600);
  const item = newLegacyInviteRollup("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
