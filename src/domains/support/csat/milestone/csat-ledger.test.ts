import assert from "node:assert/strict";
import { test } from "node:test";
import { newCsatLedger } from "./csat-ledger.js";

test("CsatLedger starts in open", () => {
  const item = newCsatLedger("code-893", "name-684");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CsatLedger moves to reopened", () => {
  const item = newCsatLedger("code-893", "name-684");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("CsatLedger rejects moves from archived", () => {
  const item = newCsatLedger("code-893", "name-684");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
