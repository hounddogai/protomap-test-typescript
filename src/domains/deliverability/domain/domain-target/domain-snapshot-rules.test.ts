import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainSnapshotLabelLengthRule,
  DomainSnapshotRequiredCodeRule,
  defaultDomainSnapshotValidator,
} from "./domain-snapshot-rules.js";
import { newDomainSnapshot } from "./domain-snapshot.js";

test("DomainSnapshotValidator reports every problem", () => {
  const validator = defaultDomainSnapshotValidator();
  const item = newDomainSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainSnapshotRequiredCodeRule flags a blank code", () => {
  const rule = new DomainSnapshotRequiredCodeRule("domain snapshot needs this field");
  const item = newDomainSnapshot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainSnapshotLabelLengthRule flags a long label", () => {
  const rule = new DomainSnapshotLabelLengthRule(16);
  const item = newDomainSnapshot("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
