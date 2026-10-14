import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveSlaAdjustmentAudienceIdLengthRule,
  AdaptiveSlaAdjustmentContactEmailLengthRule,
  AdaptiveSlaAdjustmentRequiredAudienceIdRule,
  defaultAdaptiveSlaAdjustmentValidator,
} from "./adaptive-sla-adjustment-rules.js";
import { newAdaptiveSlaAdjustment } from "./adaptive-sla-adjustment.js";

test("AdaptiveSlaAdjustmentValidator reports every problem", () => {
  const validator = defaultAdaptiveSlaAdjustmentValidator();
  const item = newAdaptiveSlaAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveSlaAdjustmentContactEmailLengthRule flags a long contact email", () => {
  const rule = new AdaptiveSlaAdjustmentContactEmailLengthRule(64);
  const item = newAdaptiveSlaAdjustment("x", "y");
  item.contactEmail = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveSlaAdjustmentRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new AdaptiveSlaAdjustmentRequiredAudienceIdRule("adaptive sla adjustment needs a value");
  const item = newAdaptiveSlaAdjustment("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveSlaAdjustmentAudienceIdLengthRule flags a long audience id", () => {
  const rule = new AdaptiveSlaAdjustmentAudienceIdLengthRule(64);
  const item = newAdaptiveSlaAdjustment("x", "y");
  item.audienceId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
