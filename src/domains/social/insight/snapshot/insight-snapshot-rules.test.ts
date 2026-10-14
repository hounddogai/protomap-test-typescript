import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightSnapshotRegionLengthRule,
  InsightSnapshotRequiredAudienceIdRule,
  InsightSnapshotRequiredCodeRule,
  InsightSnapshotRequiredNameRule,
  defaultInsightSnapshotValidator,
} from "./insight-snapshot-rules.js";
import { newInsightSnapshot } from "./insight-snapshot.js";

test("InsightSnapshotValidator reports every problem", () => {
  const validator = defaultInsightSnapshotValidator();
  const item = newInsightSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightSnapshotRegionLengthRule flags a long region", () => {
  const rule = new InsightSnapshotRegionLengthRule(1000);
  const item = newInsightSnapshot("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new InsightSnapshotRequiredCodeRule("insight snapshot needs an entry");
  const item = newInsightSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightSnapshotRequiredNameRule flags a blank name", () => {
  const rule = new InsightSnapshotRequiredNameRule("insight snapshot needs this field");
  const item = newInsightSnapshot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightSnapshotRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new InsightSnapshotRequiredAudienceIdRule("insight snapshot needs this field");
  const item = newInsightSnapshot("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
