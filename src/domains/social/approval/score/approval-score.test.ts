import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalScore } from "./approval-score.js";

test("ApprovalScore starts in created", () => {
  const item = newApprovalScore("code-6", "title-914");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalScore moves to retired", () => {
  const item = newApprovalScore("code-6", "title-914");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ApprovalScore rejects moves from retired", () => {
  const item = newApprovalScore("code-6", "title-914");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
