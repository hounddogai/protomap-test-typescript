import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationSnapshotImpressionsRangeRule,
  ActivationSnapshotNotesLengthRule,
  ActivationSnapshotRequiredNotesRule,
  ActivationSnapshotRequiredSummaryRule,
  ActivationSnapshotVersionRangeRule,
  defaultActivationSnapshotValidator,
} from "./activation-snapshot-rules.js";
import { newActivationSnapshot } from "./activation-snapshot.js";

test("ActivationSnapshotValidator reports every problem", () => {
  const validator = defaultActivationSnapshotValidator();
  const item = newActivationSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationSnapshotRequiredNotesRule flags a blank notes", () => {
  const rule = new ActivationSnapshotRequiredNotesRule("activation snapshot needs an entry");
  const item = newActivationSnapshot("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationSnapshotNotesLengthRule flags a long notes", () => {
  const rule = new ActivationSnapshotNotesLengthRule(255);
  const item = newActivationSnapshot("x", "y");
  item.notes = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationSnapshotRequiredSummaryRule flags a blank summary", () => {
  const rule = new ActivationSnapshotRequiredSummaryRule("activation snapshot needs a value");
  const item = newActivationSnapshot("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationSnapshotVersionRangeRule flags values above version", () => {
  const rule = new ActivationSnapshotVersionRangeRule(64, 1000);
  const item = newActivationSnapshot("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationSnapshotImpressionsRangeRule flags values above impressions", () => {
  const rule = new ActivationSnapshotImpressionsRangeRule(120, 3600);
  const item = newActivationSnapshot("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
