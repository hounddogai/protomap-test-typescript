import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultBranchLedger } from "./default-branch-ledger.js";

test("DefaultBranchLedger starts in open", () => {
  const item = newDefaultBranchLedger("code-481", "title-183");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultBranchLedger moves to resolved", () => {
  const item = newDefaultBranchLedger("code-481", "title-183");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("DefaultBranchLedger rejects moves from archived", () => {
  const item = newDefaultBranchLedger("code-481", "title-183");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
