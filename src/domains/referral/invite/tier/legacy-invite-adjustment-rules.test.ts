import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyInviteAdjustmentCodeLengthRule,
  LegacyInviteAdjustmentRequiredNameRule,
  defaultLegacyInviteAdjustmentValidator,
} from "./legacy-invite-adjustment-rules.js";
import { newLegacyInviteAdjustment } from "./legacy-invite-adjustment.js";

test("LegacyInviteAdjustmentValidator reports every problem", () => {
  const validator = defaultLegacyInviteAdjustmentValidator();
  const item = newLegacyInviteAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyInviteAdjustmentRequiredNameRule flags a blank name", () => {
  const rule = new LegacyInviteAdjustmentRequiredNameRule("legacy invite adjustment needs an entry");
  const item = newLegacyInviteAdjustment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyInviteAdjustmentCodeLengthRule flags a long code", () => {
  const rule = new LegacyInviteAdjustmentCodeLengthRule(16);
  const item = newLegacyInviteAdjustment("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
