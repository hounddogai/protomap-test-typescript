import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSuppressionManifest } from "./regional-suppression-manifest.js";

test("RegionalSuppressionManifest starts in idle", () => {
  const item = newRegionalSuppressionManifest("code-166", "label-996");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSuppressionManifest moves to stopped", () => {
  const item = newRegionalSuppressionManifest("code-166", "label-996");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("RegionalSuppressionManifest rejects moves from stopped", () => {
  const item = newRegionalSuppressionManifest("code-166", "label-996");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
