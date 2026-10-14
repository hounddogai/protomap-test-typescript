import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryOptOutLedger } from "./primary-opt-out-ledger.js";

test("PrimaryOptOutLedger starts in new", () => {
  const item = newPrimaryOptOutLedger("code-239", "title-605");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryOptOutLedger moves to done", () => {
  const item = newPrimaryOptOutLedger("code-239", "title-605");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PrimaryOptOutLedger rejects moves from failed", () => {
  const item = newPrimaryOptOutLedger("code-239", "title-605");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
