import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalTierManifest } from "./global-tier-manifest.js";

test("GlobalTierManifest starts in planned", () => {
  const item = newGlobalTierManifest("code-25", "name-707");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalTierManifest moves to in progress", () => {
  const item = newGlobalTierManifest("code-25", "name-707");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("GlobalTierManifest rejects moves from cancelled", () => {
  const item = newGlobalTierManifest("code-25", "name-707");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
