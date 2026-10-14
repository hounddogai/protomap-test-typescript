import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryBadgeEntry } from "./primary-badge-entry.js";

test("PrimaryBadgeEntry starts in idle", () => {
  const item = newPrimaryBadgeEntry("code-407", "label-560");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryBadgeEntry moves to draining", () => {
  const item = newPrimaryBadgeEntry("code-407", "label-560");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("PrimaryBadgeEntry rejects moves from stopped", () => {
  const item = newPrimaryBadgeEntry("code-407", "label-560");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
