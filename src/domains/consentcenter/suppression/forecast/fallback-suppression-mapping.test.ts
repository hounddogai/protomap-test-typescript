import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSuppressionMapping } from "./fallback-suppression-mapping.js";

test("FallbackSuppressionMapping starts in idle", () => {
  const item = newFallbackSuppressionMapping("code-49", "label-445");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSuppressionMapping moves to draining", () => {
  const item = newFallbackSuppressionMapping("code-49", "label-445");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("FallbackSuppressionMapping rejects moves from stopped", () => {
  const item = newFallbackSuppressionMapping("code-49", "label-445");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
