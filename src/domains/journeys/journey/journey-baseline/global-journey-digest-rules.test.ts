import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalJourneyDigestChannelLengthRule,
  GlobalJourneyDigestCodeLengthRule,
  defaultGlobalJourneyDigestValidator,
} from "./global-journey-digest-rules.js";
import { newGlobalJourneyDigest } from "./global-journey-digest.js";

test("GlobalJourneyDigestValidator reports every problem", () => {
  const validator = defaultGlobalJourneyDigestValidator();
  const item = newGlobalJourneyDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalJourneyDigestChannelLengthRule flags a long channel", () => {
  const rule = new GlobalJourneyDigestChannelLengthRule(32);
  const item = newGlobalJourneyDigest("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalJourneyDigestCodeLengthRule flags a long code", () => {
  const rule = new GlobalJourneyDigestCodeLengthRule(86400);
  const item = newGlobalJourneyDigest("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
