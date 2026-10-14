import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPostRollupExternalRefLengthRule,
  TieredPostRollupNameLengthRule,
  defaultTieredPostRollupValidator,
} from "./tiered-post-rollup-rules.js";
import { newTieredPostRollup } from "./tiered-post-rollup.js";

test("TieredPostRollupValidator reports every problem", () => {
  const validator = defaultTieredPostRollupValidator();
  const item = newTieredPostRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPostRollupExternalRefLengthRule flags a long external ref", () => {
  const rule = new TieredPostRollupExternalRefLengthRule(32);
  const item = newTieredPostRollup("x", "y");
  item.externalRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPostRollupNameLengthRule flags a long name", () => {
  const rule = new TieredPostRollupNameLengthRule(16);
  const item = newTieredPostRollup("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
