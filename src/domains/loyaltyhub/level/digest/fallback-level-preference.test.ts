import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackLevelPreference } from "./fallback-level-preference.js";

test("FallbackLevelPreference starts in new", () => {
  const item = newFallbackLevelPreference("code-633", "label-74");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackLevelPreference moves to queued", () => {
  const item = newFallbackLevelPreference("code-633", "label-74");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackLevelPreference rejects moves from failed", () => {
  const item = newFallbackLevelPreference("code-633", "label-74");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
