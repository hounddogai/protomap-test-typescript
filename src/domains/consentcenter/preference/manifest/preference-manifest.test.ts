import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceManifest } from "./preference-manifest.js";

test("PreferenceManifest starts in draft", () => {
  const item = newPreferenceManifest("code-144", "title-278");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceManifest moves to active", () => {
  const item = newPreferenceManifest("code-144", "title-278");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PreferenceManifest rejects moves from closed", () => {
  const item = newPreferenceManifest("code-144", "title-278");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
