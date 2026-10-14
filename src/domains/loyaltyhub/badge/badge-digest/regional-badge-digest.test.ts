import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalBadgeDigest } from "./regional-badge-digest.js";

test("RegionalBadgeDigest starts in created", () => {
  const item = newRegionalBadgeDigest("code-20", "name-465");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalBadgeDigest moves to published", () => {
  const item = newRegionalBadgeDigest("code-20", "name-465");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RegionalBadgeDigest rejects moves from retired", () => {
  const item = newRegionalBadgeDigest("code-20", "name-465");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
