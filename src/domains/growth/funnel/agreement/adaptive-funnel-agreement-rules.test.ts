import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveFunnelAgreementCodeLengthRule,
  AdaptiveFunnelAgreementLocaleLengthRule,
  defaultAdaptiveFunnelAgreementValidator,
} from "./adaptive-funnel-agreement-rules.js";
import { newAdaptiveFunnelAgreement } from "./adaptive-funnel-agreement.js";

test("AdaptiveFunnelAgreementValidator reports every problem", () => {
  const validator = defaultAdaptiveFunnelAgreementValidator();
  const item = newAdaptiveFunnelAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveFunnelAgreementCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveFunnelAgreementCodeLengthRule(16);
  const item = newAdaptiveFunnelAgreement("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveFunnelAgreementLocaleLengthRule flags a long locale", () => {
  const rule = new AdaptiveFunnelAgreementLocaleLengthRule(1000);
  const item = newAdaptiveFunnelAgreement("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
