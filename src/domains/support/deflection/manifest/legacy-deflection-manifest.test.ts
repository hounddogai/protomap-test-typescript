import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyDeflectionManifest } from "./legacy-deflection-manifest.js";

test("LegacyDeflectionManifest starts in requested", () => {
  const item = newLegacyDeflectionManifest("code-77", "label-378");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyDeflectionManifest moves to granted", () => {
  const item = newLegacyDeflectionManifest("code-77", "label-378");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LegacyDeflectionManifest rejects moves from expired", () => {
  const item = newLegacyDeflectionManifest("code-77", "label-378");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
