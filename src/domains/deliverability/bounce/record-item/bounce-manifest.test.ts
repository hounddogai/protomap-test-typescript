import assert from "node:assert/strict";
import { test } from "node:test";
import { newBounceManifest } from "./bounce-manifest.js";

test("BounceManifest starts in planned", () => {
  const item = newBounceManifest("code-700", "name-939");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BounceManifest moves to scheduled", () => {
  const item = newBounceManifest("code-700", "name-939");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BounceManifest rejects moves from cancelled", () => {
  const item = newBounceManifest("code-700", "name-939");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
