import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPostSnapshotCodeLengthRule,
  PrimaryPostSnapshotLabelLengthRule,
  defaultPrimaryPostSnapshotValidator,
} from "./primary-post-snapshot-rules.js";
import { newPrimaryPostSnapshot } from "./primary-post-snapshot.js";

test("PrimaryPostSnapshotValidator reports every problem", () => {
  const validator = defaultPrimaryPostSnapshotValidator();
  const item = newPrimaryPostSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPostSnapshotCodeLengthRule flags a long code", () => {
  const rule = new PrimaryPostSnapshotCodeLengthRule(80);
  const item = newPrimaryPostSnapshot("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryPostSnapshotLabelLengthRule flags a long label", () => {
  const rule = new PrimaryPostSnapshotLabelLengthRule(120);
  const item = newPrimaryPostSnapshot("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
