import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictBranchManifest } from "./strict-branch-manifest.js";

test("StrictBranchManifest starts in planned", () => {
  const item = newStrictBranchManifest("code-418", "name-819");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictBranchManifest moves to in progress", () => {
  const item = newStrictBranchManifest("code-418", "name-819");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("StrictBranchManifest rejects moves from cancelled", () => {
  const item = newStrictBranchManifest("code-418", "name-819");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
