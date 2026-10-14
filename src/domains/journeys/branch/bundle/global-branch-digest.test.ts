import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalBranchDigest } from "./global-branch-digest.js";

test("GlobalBranchDigest starts in new", () => {
  const item = newGlobalBranchDigest("code-949", "label-793");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalBranchDigest moves to failed", () => {
  const item = newGlobalBranchDigest("code-949", "label-793");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("GlobalBranchDigest rejects moves from failed", () => {
  const item = newGlobalBranchDigest("code-949", "label-793");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
