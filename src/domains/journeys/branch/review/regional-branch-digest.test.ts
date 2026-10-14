import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalBranchDigest } from "./regional-branch-digest.js";

test("RegionalBranchDigest starts in proposed", () => {
  const item = newRegionalBranchDigest("code-61", "title-429");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalBranchDigest moves to rejected", () => {
  const item = newRegionalBranchDigest("code-61", "title-429");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RegionalBranchDigest rejects moves from withdrawn", () => {
  const item = newRegionalBranchDigest("code-61", "title-429");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
