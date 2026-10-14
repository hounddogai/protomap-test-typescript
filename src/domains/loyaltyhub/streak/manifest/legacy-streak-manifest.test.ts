import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyStreakManifest } from "./legacy-streak-manifest.js";

test("LegacyStreakManifest starts in new", () => {
  const item = newLegacyStreakManifest("code-820", "label-576");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyStreakManifest moves to running", () => {
  const item = newLegacyStreakManifest("code-820", "label-576");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyStreakManifest rejects moves from failed", () => {
  const item = newLegacyStreakManifest("code-820", "label-576");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
