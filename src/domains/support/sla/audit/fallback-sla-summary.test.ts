import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackSlaSummary } from "./fallback-sla-summary.js";

test("FallbackSlaSummary starts in open", () => {
  const item = newFallbackSlaSummary("code-99", "title-138");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackSlaSummary moves to reopened", () => {
  const item = newFallbackSlaSummary("code-99", "title-138");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("FallbackSlaSummary rejects moves from archived", () => {
  const item = newFallbackSlaSummary("code-99", "title-138");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
