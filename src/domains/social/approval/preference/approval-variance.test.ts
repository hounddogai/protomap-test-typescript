import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalVariance } from "./approval-variance.js";

test("ApprovalVariance starts in draft", () => {
  const item = newApprovalVariance("code-399", "title-201");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalVariance moves to suspended", () => {
  const item = newApprovalVariance("code-399", "title-201");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ApprovalVariance rejects moves from closed", () => {
  const item = newApprovalVariance("code-399", "title-201");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
