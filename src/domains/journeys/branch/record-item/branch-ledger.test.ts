import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchLedger } from "./branch-ledger.js";

test("BranchLedger starts in created", () => {
  const item = newBranchLedger("code-404", "title-164");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchLedger moves to published", () => {
  const item = newBranchLedger("code-404", "title-164");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("BranchLedger rejects moves from retired", () => {
  const item = newBranchLedger("code-404", "title-164");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
