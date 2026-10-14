import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSuppressionAudit } from "./fallback-suppression-audit.js";

test("FallbackSuppressionAudit starts in open", () => {
  const item = newFallbackSuppressionAudit("code-416", "title-760");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSuppressionAudit moves to archived", () => {
  const item = newFallbackSuppressionAudit("code-416", "title-760");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("FallbackSuppressionAudit rejects moves from archived", () => {
  const item = newFallbackSuppressionAudit("code-416", "title-760");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
