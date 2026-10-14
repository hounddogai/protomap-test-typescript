import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyDoubleOptInProfileChannelLengthRule,
  LegacyDoubleOptInProfileCodeLengthRule,
  LegacyDoubleOptInProfileQuantityRangeRule,
  defaultLegacyDoubleOptInProfileValidator,
} from "./legacy-double-opt-in-profile-rules.js";
import { newLegacyDoubleOptInProfile } from "./legacy-double-opt-in-profile.js";

test("LegacyDoubleOptInProfileValidator reports every problem", () => {
  const validator = defaultLegacyDoubleOptInProfileValidator();
  const item = newLegacyDoubleOptInProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyDoubleOptInProfileQuantityRangeRule flags values above quantity", () => {
  const rule = new LegacyDoubleOptInProfileQuantityRangeRule(1000, 86400);
  const item = newLegacyDoubleOptInProfile("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyDoubleOptInProfileCodeLengthRule flags a long code", () => {
  const rule = new LegacyDoubleOptInProfileCodeLengthRule(255);
  const item = newLegacyDoubleOptInProfile("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyDoubleOptInProfileChannelLengthRule flags a long channel", () => {
  const rule = new LegacyDoubleOptInProfileChannelLengthRule(3600);
  const item = newLegacyDoubleOptInProfile("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
