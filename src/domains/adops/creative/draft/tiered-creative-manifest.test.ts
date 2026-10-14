import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredCreativeManifest } from "./tiered-creative-manifest.js";

test("TieredCreativeManifest starts in open", () => {
  const item = newTieredCreativeManifest("code-783", "title-336");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredCreativeManifest moves to resolved", () => {
  const item = newTieredCreativeManifest("code-783", "title-336");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("TieredCreativeManifest rejects moves from archived", () => {
  const item = newTieredCreativeManifest("code-783", "title-336");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
