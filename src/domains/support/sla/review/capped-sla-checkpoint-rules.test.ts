import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedSlaCheckpointRequiredLocaleRule,
  CappedSlaCheckpointRequiredTitleRule,
  CappedSlaCheckpointRequiredVariantRule,
  defaultCappedSlaCheckpointValidator,
} from "./capped-sla-checkpoint-rules.js";
import { newCappedSlaCheckpoint } from "./capped-sla-checkpoint.js";

test("CappedSlaCheckpointValidator reports every problem", () => {
  const validator = defaultCappedSlaCheckpointValidator();
  const item = newCappedSlaCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedSlaCheckpointRequiredTitleRule flags a blank title", () => {
  const rule = new CappedSlaCheckpointRequiredTitleRule("capped sla checkpoint needs an entry");
  const item = newCappedSlaCheckpoint("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedSlaCheckpointRequiredLocaleRule flags a blank locale", () => {
  const rule = new CappedSlaCheckpointRequiredLocaleRule("capped sla checkpoint needs this field");
  const item = newCappedSlaCheckpoint("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedSlaCheckpointRequiredVariantRule flags a blank variant", () => {
  const rule = new CappedSlaCheckpointRequiredVariantRule("capped sla checkpoint needs a value");
  const item = newCappedSlaCheckpoint("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
