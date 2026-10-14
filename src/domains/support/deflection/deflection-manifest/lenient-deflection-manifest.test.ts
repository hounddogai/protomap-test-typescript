import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientDeflectionManifest } from "./lenient-deflection-manifest.js";

test("LenientDeflectionManifest starts in proposed", () => {
  const item = newLenientDeflectionManifest("code-44", "name-510");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientDeflectionManifest moves to rejected", () => {
  const item = newLenientDeflectionManifest("code-44", "name-510");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LenientDeflectionManifest rejects moves from withdrawn", () => {
  const item = newLenientDeflectionManifest("code-44", "name-510");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
