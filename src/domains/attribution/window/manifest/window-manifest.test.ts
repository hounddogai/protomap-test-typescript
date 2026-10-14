import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowManifest } from "./window-manifest.js";

test("WindowManifest starts in open", () => {
  const item = newWindowManifest("code-447", "title-356");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowManifest moves to reopened", () => {
  const item = newWindowManifest("code-447", "title-356");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("WindowManifest rejects moves from archived", () => {
  const item = newWindowManifest("code-447", "title-356");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
