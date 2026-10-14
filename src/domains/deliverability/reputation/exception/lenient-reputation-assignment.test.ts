import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientReputationAssignment } from "./lenient-reputation-assignment.js";

test("LenientReputationAssignment starts in proposed", () => {
  const item = newLenientReputationAssignment("code-544", "name-73");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientReputationAssignment moves to rejected", () => {
  const item = newLenientReputationAssignment("code-544", "name-73");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("LenientReputationAssignment rejects moves from withdrawn", () => {
  const item = newLenientReputationAssignment("code-544", "name-73");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
