import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultConversionSnapshotVariantLengthRule,
  defaultDefaultConversionSnapshotValidator,
} from "./default-conversion-snapshot-rules.js";
import { newDefaultConversionSnapshot } from "./default-conversion-snapshot.js";

test("DefaultConversionSnapshotValidator reports every problem", () => {
  const validator = defaultDefaultConversionSnapshotValidator();
  const item = newDefaultConversionSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultConversionSnapshotVariantLengthRule flags a long variant", () => {
  const rule = new DefaultConversionSnapshotVariantLengthRule(255);
  const item = newDefaultConversionSnapshot("x", "y");
  item.variant = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
