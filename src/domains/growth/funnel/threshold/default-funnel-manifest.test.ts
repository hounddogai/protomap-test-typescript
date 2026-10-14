import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultFunnelManifest } from "./default-funnel-manifest.js";

test("DefaultFunnelManifest starts in open", () => {
  const item = newDefaultFunnelManifest("code-506", "name-603");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultFunnelManifest moves to in review", () => {
  const item = newDefaultFunnelManifest("code-506", "name-603");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("DefaultFunnelManifest rejects moves from archived", () => {
  const item = newDefaultFunnelManifest("code-506", "name-603");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
