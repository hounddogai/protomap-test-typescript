import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackMentionAdjustment } from "./fallback-mention-adjustment.js";

test("FallbackMentionAdjustment starts in created", () => {
  const item = newFallbackMentionAdjustment("code-173", "label-273");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackMentionAdjustment moves to validated", () => {
  const item = newFallbackMentionAdjustment("code-173", "label-273");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackMentionAdjustment rejects moves from retired", () => {
  const item = newFallbackMentionAdjustment("code-173", "label-273");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
