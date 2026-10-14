import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalProofManifest } from "./seasonal-proof-manifest.js";

test("SeasonalProofManifest starts in new", () => {
  const item = newSeasonalProofManifest("code-385", "name-392");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalProofManifest moves to done", () => {
  const item = newSeasonalProofManifest("code-385", "name-392");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("SeasonalProofManifest rejects moves from failed", () => {
  const item = newSeasonalProofManifest("code-385", "name-392");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
