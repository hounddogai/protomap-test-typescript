import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalBadgeManifest } from "./regional-badge-manifest.js";

test("RegionalBadgeManifest starts in new", () => {
  const item = newRegionalBadgeManifest("code-28", "name-971");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalBadgeManifest moves to failed", () => {
  const item = newRegionalBadgeManifest("code-28", "name-971");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("RegionalBadgeManifest rejects moves from failed", () => {
  const item = newRegionalBadgeManifest("code-28", "name-971");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
