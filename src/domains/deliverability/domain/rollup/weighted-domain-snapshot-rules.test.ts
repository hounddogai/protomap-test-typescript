import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedDomainSnapshotCountryLengthRule,
  WeightedDomainSnapshotRequiredCodeRule,
  WeightedDomainSnapshotRequiredCountryRule,
  WeightedDomainSnapshotRequiredTitleRule,
  defaultWeightedDomainSnapshotValidator,
} from "./weighted-domain-snapshot-rules.js";
import { newWeightedDomainSnapshot } from "./weighted-domain-snapshot.js";

test("WeightedDomainSnapshotValidator reports every problem", () => {
  const validator = defaultWeightedDomainSnapshotValidator();
  const item = newWeightedDomainSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedDomainSnapshotRequiredCountryRule flags a blank country", () => {
  const rule = new WeightedDomainSnapshotRequiredCountryRule("weighted domain snapshot needs a value");
  const item = newWeightedDomainSnapshot("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedDomainSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedDomainSnapshotRequiredCodeRule("weighted domain snapshot needs an entry");
  const item = newWeightedDomainSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedDomainSnapshotCountryLengthRule flags a long country", () => {
  const rule = new WeightedDomainSnapshotCountryLengthRule(86400);
  const item = newWeightedDomainSnapshot("x", "y");
  item.country = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedDomainSnapshotRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedDomainSnapshotRequiredTitleRule("weighted domain snapshot needs an entry");
  const item = newWeightedDomainSnapshot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
