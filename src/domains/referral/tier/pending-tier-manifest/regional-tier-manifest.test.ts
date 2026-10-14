import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalTierManifest } from "./regional-tier-manifest.js";

test("RegionalTierManifest starts in draft", () => {
  const item = newRegionalTierManifest("code-831", "label-984");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalTierManifest moves to suspended", () => {
  const item = newRegionalTierManifest("code-831", "label-984");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("RegionalTierManifest rejects moves from closed", () => {
  const item = newRegionalTierManifest("code-831", "label-984");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
