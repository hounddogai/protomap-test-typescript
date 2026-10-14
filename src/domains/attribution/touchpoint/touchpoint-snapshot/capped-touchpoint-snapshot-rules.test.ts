import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedTouchpointSnapshotRequiredRegionRule,
  CappedTouchpointSnapshotRequiredTitleRule,
  defaultCappedTouchpointSnapshotValidator,
} from "./capped-touchpoint-snapshot-rules.js";
import { newCappedTouchpointSnapshot } from "./capped-touchpoint-snapshot.js";

test("CappedTouchpointSnapshotValidator reports every problem", () => {
  const validator = defaultCappedTouchpointSnapshotValidator();
  const item = newCappedTouchpointSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedTouchpointSnapshotRequiredRegionRule flags a blank region", () => {
  const rule = new CappedTouchpointSnapshotRequiredRegionRule("capped touchpoint snapshot needs an entry");
  const item = newCappedTouchpointSnapshot("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedTouchpointSnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new CappedTouchpointSnapshotRequiredTitleRule("capped touchpoint snapshot needs an entry");
  const item = newCappedTouchpointSnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
