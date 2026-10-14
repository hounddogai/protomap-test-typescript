import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPayoutManifest } from "./primary-payout-manifest.js";

test("PrimaryPayoutManifest starts in proposed", () => {
  const item = newPrimaryPayoutManifest("code-144", "name-165");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPayoutManifest moves to withdrawn", () => {
  const item = newPrimaryPayoutManifest("code-144", "name-165");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PrimaryPayoutManifest rejects moves from withdrawn", () => {
  const item = newPrimaryPayoutManifest("code-144", "name-165");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
