import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredSuppressionManifest } from "./tiered-suppression-manifest.js";

test("TieredSuppressionManifest starts in new", () => {
  const item = newTieredSuppressionManifest("code-629", "title-428");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredSuppressionManifest moves to queued", () => {
  const item = newTieredSuppressionManifest("code-629", "title-428");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TieredSuppressionManifest rejects moves from failed", () => {
  const item = newTieredSuppressionManifest("code-629", "title-428");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
