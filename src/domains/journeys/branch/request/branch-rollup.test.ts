import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchRollup } from "./branch-rollup.js";

test("BranchRollup starts in requested", () => {
  const item = newBranchRollup("code-205", "label-592");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchRollup moves to granted", () => {
  const item = newBranchRollup("code-205", "label-592");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BranchRollup rejects moves from expired", () => {
  const item = newBranchRollup("code-205", "label-592");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
