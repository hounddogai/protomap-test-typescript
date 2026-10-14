import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackInsightException } from "./fallback-insight-exception.js";

test("FallbackInsightException starts in draft", () => {
  const item = newFallbackInsightException("code-821", "name-7");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackInsightException moves to closed", () => {
  const item = newFallbackInsightException("code-821", "name-7");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("FallbackInsightException rejects moves from closed", () => {
  const item = newFallbackInsightException("code-821", "name-7");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
