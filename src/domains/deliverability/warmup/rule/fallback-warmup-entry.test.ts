import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackWarmupEntry } from "./fallback-warmup-entry.js";

test("FallbackWarmupEntry starts in proposed", () => {
  const item = newFallbackWarmupEntry("code-300", "title-522");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackWarmupEntry moves to approved", () => {
  const item = newFallbackWarmupEntry("code-300", "title-522");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FallbackWarmupEntry rejects moves from withdrawn", () => {
  const item = newFallbackWarmupEntry("code-300", "title-522");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
