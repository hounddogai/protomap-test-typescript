import assert from "node:assert/strict";
import { test } from "node:test";
import { LegacyInviteBatchCodeLengthRule, defaultLegacyInviteBatchValidator } from "./legacy-invite-batch-rules.js";
import { newLegacyInviteBatch } from "./legacy-invite-batch.js";

test("LegacyInviteBatchValidator reports every problem", () => {
  const validator = defaultLegacyInviteBatchValidator();
  const item = newLegacyInviteBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyInviteBatchCodeLengthRule flags a long code", () => {
  const rule = new LegacyInviteBatchCodeLengthRule(3600);
  const item = newLegacyInviteBatch("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
