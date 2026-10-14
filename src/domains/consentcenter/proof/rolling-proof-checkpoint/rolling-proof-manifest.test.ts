import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingProofManifest } from "./rolling-proof-manifest.js";

test("RollingProofManifest starts in proposed", () => {
  const item = newRollingProofManifest("code-455", "name-541");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingProofManifest moves to approved", () => {
  const item = newRollingProofManifest("code-455", "name-541");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RollingProofManifest rejects moves from withdrawn", () => {
  const item = newRollingProofManifest("code-455", "name-541");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
