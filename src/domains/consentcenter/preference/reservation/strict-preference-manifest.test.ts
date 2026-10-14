import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictPreferenceManifest } from "./strict-preference-manifest.js";

test("StrictPreferenceManifest starts in planned", () => {
  const item = newStrictPreferenceManifest("code-247", "title-410");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictPreferenceManifest moves to cancelled", () => {
  const item = newStrictPreferenceManifest("code-247", "title-410");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("StrictPreferenceManifest rejects moves from cancelled", () => {
  const item = newStrictPreferenceManifest("code-247", "title-410");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
