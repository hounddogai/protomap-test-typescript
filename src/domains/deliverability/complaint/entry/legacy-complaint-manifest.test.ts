import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyComplaintManifest } from "./legacy-complaint-manifest.js";

test("LegacyComplaintManifest starts in requested", () => {
  const item = newLegacyComplaintManifest("code-503", "title-477");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyComplaintManifest moves to revoked", () => {
  const item = newLegacyComplaintManifest("code-503", "title-477");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LegacyComplaintManifest rejects moves from expired", () => {
  const item = newLegacyComplaintManifest("code-503", "title-477");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
