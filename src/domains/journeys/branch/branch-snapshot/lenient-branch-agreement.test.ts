import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientBranchAgreement } from "./lenient-branch-agreement.js";

test("LenientBranchAgreement starts in draft", () => {
  const item = newLenientBranchAgreement("code-80", "title-86");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientBranchAgreement moves to pending", () => {
  const item = newLenientBranchAgreement("code-80", "title-86");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LenientBranchAgreement rejects moves from closed", () => {
  const item = newLenientBranchAgreement("code-80", "title-86");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
