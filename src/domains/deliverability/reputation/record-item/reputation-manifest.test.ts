import assert from "node:assert/strict";
import { test } from "node:test";
import { newReputationManifest } from "./reputation-manifest.js";

test("ReputationManifest starts in created", () => {
  const item = newReputationManifest("code-394", "title-823");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReputationManifest moves to validated", () => {
  const item = newReputationManifest("code-394", "title-823");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ReputationManifest rejects moves from retired", () => {
  const item = newReputationManifest("code-394", "title-823");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
