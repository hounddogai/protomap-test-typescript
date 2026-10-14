import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionManifest } from "./suppression-manifest.js";

test("SuppressionManifest starts in planned", () => {
  const item = newSuppressionManifest("code-463", "title-951");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionManifest moves to scheduled", () => {
  const item = newSuppressionManifest("code-463", "title-951");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("SuppressionManifest rejects moves from cancelled", () => {
  const item = newSuppressionManifest("code-463", "title-951");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
