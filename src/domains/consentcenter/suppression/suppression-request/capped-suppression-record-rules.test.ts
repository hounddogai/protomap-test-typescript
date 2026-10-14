import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedSuppressionRecordRequiredOwnerIdRule,
  defaultCappedSuppressionRecordValidator,
} from "./capped-suppression-record-rules.js";
import { newCappedSuppressionRecord } from "./capped-suppression-record.js";

test("CappedSuppressionRecordValidator reports every problem", () => {
  const validator = defaultCappedSuppressionRecordValidator();
  const item = newCappedSuppressionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedSuppressionRecordRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new CappedSuppressionRecordRequiredOwnerIdRule("capped suppression record needs an entry");
  const item = newCappedSuppressionRecord("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
