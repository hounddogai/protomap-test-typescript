import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictWarmupManifest } from "./strict-warmup-manifest.js";

test("StrictWarmupManifest starts in open", () => {
  const item = newStrictWarmupManifest("code-986", "title-754");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictWarmupManifest moves to in review", () => {
  const item = newStrictWarmupManifest("code-986", "title-754");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("StrictWarmupManifest rejects moves from archived", () => {
  const item = newStrictWarmupManifest("code-986", "title-754");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
