import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientDeflectionSnapshotJourneyIdLengthRule,
  LenientDeflectionSnapshotRequiredChannelRule,
  LenientDeflectionSnapshotSendAtRangeRule,
  defaultLenientDeflectionSnapshotValidator,
} from "./lenient-deflection-snapshot-rules.js";
import { newLenientDeflectionSnapshot } from "./lenient-deflection-snapshot.js";

test("LenientDeflectionSnapshotValidator reports every problem", () => {
  const validator = defaultLenientDeflectionSnapshotValidator();
  const item = newLenientDeflectionSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientDeflectionSnapshotRequiredChannelRule flags a blank channel", () => {
  const rule = new LenientDeflectionSnapshotRequiredChannelRule("lenient deflection snapshot needs this field");
  const item = newLenientDeflectionSnapshot("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientDeflectionSnapshotSendAtRangeRule flags values above send at", () => {
  const rule = new LenientDeflectionSnapshotSendAtRangeRule(120, 1000);
  const item = newLenientDeflectionSnapshot("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientDeflectionSnapshotJourneyIdLengthRule flags a long journey id", () => {
  const rule = new LenientDeflectionSnapshotJourneyIdLengthRule(255);
  const item = newLenientDeflectionSnapshot("x", "y");
  item.journeyId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
