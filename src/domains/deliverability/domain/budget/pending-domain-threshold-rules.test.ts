import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingDomainThresholdChannelLengthRule,
  PendingDomainThresholdDurationMinutesRangeRule,
  PendingDomainThresholdNameLengthRule,
  PendingDomainThresholdVersionRangeRule,
  defaultPendingDomainThresholdValidator,
} from "./pending-domain-threshold-rules.js";
import { newPendingDomainThreshold } from "./pending-domain-threshold.js";

test("PendingDomainThresholdValidator reports every problem", () => {
  const validator = defaultPendingDomainThresholdValidator();
  const item = newPendingDomainThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingDomainThresholdDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new PendingDomainThresholdDurationMinutesRangeRule(120, 3600);
  const item = newPendingDomainThreshold("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingDomainThresholdNameLengthRule flags a long name", () => {
  const rule = new PendingDomainThresholdNameLengthRule(3600);
  const item = newPendingDomainThreshold("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingDomainThresholdChannelLengthRule flags a long channel", () => {
  const rule = new PendingDomainThresholdChannelLengthRule(80);
  const item = newPendingDomainThreshold("x", "y");
  item.channel = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingDomainThresholdVersionRangeRule flags values above version", () => {
  const rule = new PendingDomainThresholdVersionRangeRule(120, 255);
  const item = newPendingDomainThreshold("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
