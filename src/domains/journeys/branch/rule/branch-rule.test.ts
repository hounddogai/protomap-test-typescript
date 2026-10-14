import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchRule } from "./branch-rule.js";

test("BranchRule starts in open", () => {
  const item = newBranchRule("code-792", "title-906");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchRule moves to reopened", () => {
  const item = newBranchRule("code-792", "title-906");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("BranchRule rejects moves from archived", () => {
  const item = newBranchRule("code-792", "title-906");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
