import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTierManifest } from "./manual-tier-manifest.js";

test("ManualTierManifest starts in requested", () => {
  const item = newManualTierManifest("code-436", "label-103");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTierManifest moves to granted", () => {
  const item = newManualTierManifest("code-436", "label-103");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ManualTierManifest rejects moves from expired", () => {
  const item = newManualTierManifest("code-436", "label-103");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
