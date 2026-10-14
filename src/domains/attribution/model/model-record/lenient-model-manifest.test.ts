import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientModelManifest } from "./lenient-model-manifest.js";

test("LenientModelManifest starts in requested", () => {
  const item = newLenientModelManifest("code-300", "label-505");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientModelManifest moves to expired", () => {
  const item = newLenientModelManifest("code-300", "label-505");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("LenientModelManifest rejects moves from expired", () => {
  const item = newLenientModelManifest("code-300", "label-505");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
