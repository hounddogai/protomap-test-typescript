import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualFunnelManifest } from "./manual-funnel-manifest.js";

test("ManualFunnelManifest starts in requested", () => {
  const item = newManualFunnelManifest("code-959", "name-996");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualFunnelManifest moves to granted", () => {
  const item = newManualFunnelManifest("code-959", "name-996");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ManualFunnelManifest rejects moves from expired", () => {
  const item = newManualFunnelManifest("code-959", "name-996");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
