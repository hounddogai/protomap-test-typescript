import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalChallengeSnapshotBidRangeRule,
  GlobalChallengeSnapshotMarginRangeRule,
  GlobalChallengeSnapshotRequiredCountryRule,
  GlobalChallengeSnapshotRequiredUnitRule,
  defaultGlobalChallengeSnapshotValidator,
} from "./global-challenge-snapshot-rules.js";
import { newGlobalChallengeSnapshot } from "./global-challenge-snapshot.js";

test("GlobalChallengeSnapshotValidator reports every problem", () => {
  const validator = defaultGlobalChallengeSnapshotValidator();
  const item = newGlobalChallengeSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalChallengeSnapshotBidRangeRule flags values above bid", () => {
  const rule = new GlobalChallengeSnapshotBidRangeRule(5.6, 4945.6);
  const item = newGlobalChallengeSnapshot("x", "y");
  item.bid = 4947.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalChallengeSnapshotRequiredCountryRule flags a blank country", () => {
  const rule = new GlobalChallengeSnapshotRequiredCountryRule("global challenge snapshot needs an entry");
  const item = newGlobalChallengeSnapshot("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalChallengeSnapshotMarginRangeRule flags values above margin", () => {
  const rule = new GlobalChallengeSnapshotMarginRangeRule(1.1, 4701.2);
  const item = newGlobalChallengeSnapshot("x", "y");
  item.margin = 4702.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalChallengeSnapshotRequiredUnitRule flags a blank unit", () => {
  const rule = new GlobalChallengeSnapshotRequiredUnitRule("global challenge snapshot needs a value");
  const item = newGlobalChallengeSnapshot("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
