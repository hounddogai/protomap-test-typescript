import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyBadgeManifest } from "./legacy-badge-manifest.js";

test("LegacyBadgeManifest starts in draft", () => {
  const item = newLegacyBadgeManifest("code-117", "title-224");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyBadgeManifest moves to active", () => {
  const item = newLegacyBadgeManifest("code-117", "title-224");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LegacyBadgeManifest rejects moves from closed", () => {
  const item = newLegacyBadgeManifest("code-117", "title-224");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
