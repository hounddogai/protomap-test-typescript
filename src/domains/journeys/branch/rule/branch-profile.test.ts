import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchProfile } from "./branch-profile.js";

test("BranchProfile starts in proposed", () => {
  const item = newBranchProfile("code-85", "title-868");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchProfile moves to approved", () => {
  const item = newBranchProfile("code-85", "title-868");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BranchProfile rejects moves from withdrawn", () => {
  const item = newBranchProfile("code-85", "title-868");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
