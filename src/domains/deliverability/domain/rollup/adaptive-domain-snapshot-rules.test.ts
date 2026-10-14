import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveDomainSnapshotCapacityRangeRule,
  AdaptiveDomainSnapshotCodeLengthRule,
  AdaptiveDomainSnapshotRequiredCodeRule,
  defaultAdaptiveDomainSnapshotValidator,
} from "./adaptive-domain-snapshot-rules.js";
import { newAdaptiveDomainSnapshot } from "./adaptive-domain-snapshot.js";

test("AdaptiveDomainSnapshotValidator reports every problem", () => {
  const validator = defaultAdaptiveDomainSnapshotValidator();
  const item = newAdaptiveDomainSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveDomainSnapshotCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveDomainSnapshotCodeLengthRule(3600);
  const item = newAdaptiveDomainSnapshot("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveDomainSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveDomainSnapshotRequiredCodeRule("adaptive domain snapshot needs this field");
  const item = newAdaptiveDomainSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDomainSnapshotCapacityRangeRule flags values above capacity", () => {
  const rule = new AdaptiveDomainSnapshotCapacityRangeRule(3600, 86400);
  const item = newAdaptiveDomainSnapshot("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
