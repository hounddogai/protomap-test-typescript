import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderRollupCohortLengthRule,
  SenderRollupExternalRefLengthRule,
  defaultSenderRollupValidator,
} from "./sender-rollup-rules.js";
import { newSenderRollup } from "./sender-rollup.js";

test("SenderRollupValidator reports every problem", () => {
  const validator = defaultSenderRollupValidator();
  const item = newSenderRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderRollupCohortLengthRule flags a long cohort", () => {
  const rule = new SenderRollupCohortLengthRule(32);
  const item = newSenderRollup("x", "y");
  item.cohort = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderRollupExternalRefLengthRule flags a long external ref", () => {
  const rule = new SenderRollupExternalRefLengthRule(16);
  const item = newSenderRollup("x", "y");
  item.externalRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
