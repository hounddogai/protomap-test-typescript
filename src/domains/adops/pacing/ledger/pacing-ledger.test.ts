import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingLedger } from "./pacing-ledger.js";

test("PacingLedger starts in proposed", () => {
  const item = newPacingLedger("code-626", "name-362");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingLedger moves to approved", () => {
  const item = newPacingLedger("code-626", "name-362");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PacingLedger rejects moves from withdrawn", () => {
  const item = newPacingLedger("code-626", "name-362");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
