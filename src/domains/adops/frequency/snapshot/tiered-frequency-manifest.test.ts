import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredFrequencyManifest } from "./tiered-frequency-manifest.js";

test("TieredFrequencyManifest starts in new", () => {
  const item = newTieredFrequencyManifest("code-172", "name-921");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredFrequencyManifest moves to done", () => {
  const item = newTieredFrequencyManifest("code-172", "name-921");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("TieredFrequencyManifest rejects moves from failed", () => {
  const item = newTieredFrequencyManifest("code-172", "name-921");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
