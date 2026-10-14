import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelManifest } from "./model-manifest.js";

test("ModelManifest starts in created", () => {
  const item = newModelManifest("code-622", "label-555");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelManifest moves to validated", () => {
  const item = newModelManifest("code-622", "label-555");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ModelManifest rejects moves from retired", () => {
  const item = newModelManifest("code-622", "label-555");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
