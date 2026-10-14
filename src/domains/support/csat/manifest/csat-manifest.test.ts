import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatManifest } from "./csat-manifest.js";

test("CsatManifest starts in new", () => {
  const item = newCsatManifest("code-17", "label-749");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatManifest moves to queued", () => {
  const item = newCsatManifest("code-17", "label-749");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CsatManifest rejects moves from failed", () => {
  const item = newCsatManifest("code-17", "label-749");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
