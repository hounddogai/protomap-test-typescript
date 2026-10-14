import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackFrequencyCycle } from "./fallback-frequency-cycle.js";

test("FallbackFrequencyCycle starts in draft", () => {
  const item = newFallbackFrequencyCycle("code-479", "label-585");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackFrequencyCycle moves to active", () => {
  const item = newFallbackFrequencyCycle("code-479", "label-585");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("FallbackFrequencyCycle rejects moves from closed", () => {
  const item = newFallbackFrequencyCycle("code-479", "label-585");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
