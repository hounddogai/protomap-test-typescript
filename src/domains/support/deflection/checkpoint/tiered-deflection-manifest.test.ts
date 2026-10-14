import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredDeflectionManifest } from "./tiered-deflection-manifest.js";

test("TieredDeflectionManifest starts in draft", () => {
  const item = newTieredDeflectionManifest("code-595", "title-706");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredDeflectionManifest moves to active", () => {
  const item = newTieredDeflectionManifest("code-595", "title-706");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("TieredDeflectionManifest rejects moves from closed", () => {
  const item = newTieredDeflectionManifest("code-595", "title-706");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
