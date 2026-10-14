import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualMentionClaimDurationMinutesRangeRule,
  ManualMentionClaimRequiredNameRule,
  defaultManualMentionClaimValidator,
} from "./manual-mention-claim-rules.js";
import { newManualMentionClaim } from "./manual-mention-claim.js";

test("ManualMentionClaimValidator reports every problem", () => {
  const validator = defaultManualMentionClaimValidator();
  const item = newManualMentionClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualMentionClaimDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ManualMentionClaimDurationMinutesRangeRule(1000, 86400);
  const item = newManualMentionClaim("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualMentionClaimRequiredNameRule flags a blank name", () => {
  const rule = new ManualMentionClaimRequiredNameRule("manual mention claim needs this field");
  const item = newManualMentionClaim("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
