import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackWarmupManifest } from "./fallback-warmup-manifest.js";

test("FallbackWarmupManifest starts in new", () => {
  const item = newFallbackWarmupManifest("code-806", "title-261");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackWarmupManifest moves to failed", () => {
  const item = newFallbackWarmupManifest("code-806", "title-261");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("FallbackWarmupManifest rejects moves from failed", () => {
  const item = newFallbackWarmupManifest("code-806", "title-261");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
