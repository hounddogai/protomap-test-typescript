import assert from "node:assert/strict";
import { test } from "node:test";
import { newFrequencyManifest } from "./frequency-manifest.js";

test("FrequencyManifest starts in new", () => {
  const item = newFrequencyManifest("code-221", "title-19");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FrequencyManifest moves to queued", () => {
  const item = newFrequencyManifest("code-221", "title-19");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FrequencyManifest rejects moves from failed", () => {
  const item = newFrequencyManifest("code-221", "title-19");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
