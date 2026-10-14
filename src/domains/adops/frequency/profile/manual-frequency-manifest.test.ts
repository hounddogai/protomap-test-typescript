import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualFrequencyManifest } from "./manual-frequency-manifest.js";

test("ManualFrequencyManifest starts in idle", () => {
  const item = newManualFrequencyManifest("code-70", "label-417");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualFrequencyManifest moves to warming", () => {
  const item = newManualFrequencyManifest("code-70", "label-417");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ManualFrequencyManifest rejects moves from stopped", () => {
  const item = newManualFrequencyManifest("code-70", "label-417");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
