import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchDigest } from "./branch-digest.js";

test("BranchDigest starts in draft", () => {
  const item = newBranchDigest("code-924", "label-582");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchDigest moves to active", () => {
  const item = newBranchDigest("code-924", "label-582");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BranchDigest rejects moves from closed", () => {
  const item = newBranchDigest("code-924", "label-582");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
