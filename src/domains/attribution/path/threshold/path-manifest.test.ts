import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathManifest } from "./path-manifest.js";

test("PathManifest starts in draft", () => {
  const item = newPathManifest("code-106", "label-542");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathManifest moves to suspended", () => {
  const item = newPathManifest("code-106", "label-542");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PathManifest rejects moves from closed", () => {
  const item = newPathManifest("code-106", "label-542");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
