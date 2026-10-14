import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackStepAudit } from "./fallback-step-audit.js";

test("FallbackStepAudit starts in draft", () => {
  const item = newFallbackStepAudit("code-990", "title-649");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackStepAudit moves to active", () => {
  const item = newFallbackStepAudit("code-990", "title-649");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("FallbackStepAudit rejects moves from closed", () => {
  const item = newFallbackStepAudit("code-990", "title-649");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
