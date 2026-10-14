import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentProposal } from "./enrollment-proposal.js";

test("EnrollmentProposal starts in created", () => {
  const item = newEnrollmentProposal("code-422", "name-246");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentProposal moves to validated", () => {
  const item = newEnrollmentProposal("code-422", "name-246");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("EnrollmentProposal rejects moves from retired", () => {
  const item = newEnrollmentProposal("code-422", "name-246");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
