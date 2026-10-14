import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSuppressionGroup } from "./fallback-suppression-group.js";

test("FallbackSuppressionGroup starts in planned", () => {
  const item = newFallbackSuppressionGroup("code-866", "label-571");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSuppressionGroup moves to in progress", () => {
  const item = newFallbackSuppressionGroup("code-866", "label-571");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FallbackSuppressionGroup rejects moves from cancelled", () => {
  const item = newFallbackSuppressionGroup("code-866", "label-571");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
