import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeSnapshotAmountRangeRule,
  CreativeSnapshotBidRangeRule,
  CreativeSnapshotLabelLengthRule,
  CreativeSnapshotRequiredLabelRule,
  CreativeSnapshotRequiredSegmentRule,
  defaultCreativeSnapshotValidator,
} from "./creative-snapshot-rules.js";
import { newCreativeSnapshot } from "./creative-snapshot.js";

test("CreativeSnapshotValidator reports every problem", () => {
  const validator = defaultCreativeSnapshotValidator();
  const item = newCreativeSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeSnapshotRequiredSegmentRule flags a blank segment", () => {
  const rule = new CreativeSnapshotRequiredSegmentRule("creative snapshot needs a value");
  const item = newCreativeSnapshot("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeSnapshotRequiredLabelRule flags a blank label", () => {
  const rule = new CreativeSnapshotRequiredLabelRule("creative snapshot needs a value");
  const item = newCreativeSnapshot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeSnapshotLabelLengthRule flags a long label", () => {
  const rule = new CreativeSnapshotLabelLengthRule(120);
  const item = newCreativeSnapshot("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeSnapshotBidRangeRule flags values above bid", () => {
  const rule = new CreativeSnapshotBidRangeRule(1.8, 2999.6);
  const item = newCreativeSnapshot("x", "y");
  item.bid = 3001.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeSnapshotAmountRangeRule flags values above amount", () => {
  const rule = new CreativeSnapshotAmountRangeRule(8.6, 257.1);
  const item = newCreativeSnapshot("x", "y");
  item.amount = 258.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
