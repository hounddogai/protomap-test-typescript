import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingWarmupManifest } from "./rolling-warmup-manifest.js";

test("RollingWarmupManifest starts in new", () => {
  const item = newRollingWarmupManifest("code-474", "label-527");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingWarmupManifest moves to queued", () => {
  const item = newRollingWarmupManifest("code-474", "label-527");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingWarmupManifest rejects moves from failed", () => {
  const item = newRollingWarmupManifest("code-474", "label-527");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
