import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierManifest } from "./tier-manifest.js";

test("TierManifest starts in proposed", () => {
  const item = newTierManifest("code-861", "name-430");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierManifest moves to rejected", () => {
  const item = newTierManifest("code-861", "name-430");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("TierManifest rejects moves from withdrawn", () => {
  const item = newTierManifest("code-861", "name-430");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
