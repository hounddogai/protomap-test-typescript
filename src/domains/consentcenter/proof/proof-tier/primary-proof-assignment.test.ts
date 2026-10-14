import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryProofAssignment } from "./primary-proof-assignment.js";

test("PrimaryProofAssignment starts in open", () => {
  const item = newPrimaryProofAssignment("code-84", "title-255");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryProofAssignment moves to reopened", () => {
  const item = newPrimaryProofAssignment("code-84", "title-255");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PrimaryProofAssignment rejects moves from archived", () => {
  const item = newPrimaryProofAssignment("code-84", "title-255");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
