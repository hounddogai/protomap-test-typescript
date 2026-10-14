import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledDeflectionSnapshotCodeLengthRule,
  ScheduledDeflectionSnapshotLimitRangeRule,
  ScheduledDeflectionSnapshotUtmSourceLengthRule,
  defaultScheduledDeflectionSnapshotValidator,
} from "./scheduled-deflection-snapshot-rules.js";
import { newScheduledDeflectionSnapshot } from "./scheduled-deflection-snapshot.js";

test("ScheduledDeflectionSnapshotValidator reports every problem", () => {
  const validator = defaultScheduledDeflectionSnapshotValidator();
  const item = newScheduledDeflectionSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledDeflectionSnapshotLimitRangeRule flags values above limit", () => {
  const rule = new ScheduledDeflectionSnapshotLimitRangeRule(16, 64);
  const item = newScheduledDeflectionSnapshot("x", "y");
  item.limit = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledDeflectionSnapshotCodeLengthRule flags a long code", () => {
  const rule = new ScheduledDeflectionSnapshotCodeLengthRule(255);
  const item = newScheduledDeflectionSnapshot("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDeflectionSnapshotUtmSourceLengthRule flags a long utm source", () => {
  const rule = new ScheduledDeflectionSnapshotUtmSourceLengthRule(16);
  const item = newScheduledDeflectionSnapshot("x", "y");
  item.utmSource = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
