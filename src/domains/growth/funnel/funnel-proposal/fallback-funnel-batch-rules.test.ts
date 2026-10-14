import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackFunnelBatchRequiredNameRule,
  FallbackFunnelBatchRequiredNotesRule,
  defaultFallbackFunnelBatchValidator,
} from "./fallback-funnel-batch-rules.js";
import { newFallbackFunnelBatch } from "./fallback-funnel-batch.js";

test("FallbackFunnelBatchValidator reports every problem", () => {
  const validator = defaultFallbackFunnelBatchValidator();
  const item = newFallbackFunnelBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackFunnelBatchRequiredNotesRule flags a blank notes", () => {
  const rule = new FallbackFunnelBatchRequiredNotesRule("fallback funnel batch needs this field");
  const item = newFallbackFunnelBatch("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackFunnelBatchRequiredNameRule flags a blank name", () => {
  const rule = new FallbackFunnelBatchRequiredNameRule("fallback funnel batch needs an entry");
  const item = newFallbackFunnelBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
