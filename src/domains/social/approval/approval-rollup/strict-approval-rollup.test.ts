import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictApprovalRollup } from "./strict-approval-rollup.js";

test("StrictApprovalRollup starts in created", () => {
  const item = newStrictApprovalRollup("code-694", "title-563");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictApprovalRollup moves to validated", () => {
  const item = newStrictApprovalRollup("code-694", "title-563");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("StrictApprovalRollup rejects moves from retired", () => {
  const item = newStrictApprovalRollup("code-694", "title-563");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
