import assert from "node:assert/strict";
import { test } from "node:test";
import { newTouchpointManifest } from "./touchpoint-manifest.js";

test("TouchpointManifest starts in planned", () => {
  const item = newTouchpointManifest("code-26", "name-265");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TouchpointManifest moves to scheduled", () => {
  const item = newTouchpointManifest("code-26", "name-265");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TouchpointManifest rejects moves from cancelled", () => {
  const item = newTouchpointManifest("code-26", "name-265");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
