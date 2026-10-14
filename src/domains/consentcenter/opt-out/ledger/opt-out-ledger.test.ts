import assert from "node:assert/strict";
import { test } from "node:test";
import { newOptOutLedger } from "./opt-out-ledger.js";

test("OptOutLedger starts in draft", () => {
  const item = newOptOutLedger("code-656", "name-769");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("OptOutLedger moves to active", () => {
  const item = newOptOutLedger("code-656", "name-769");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("OptOutLedger rejects moves from closed", () => {
  const item = newOptOutLedger("code-656", "name-769");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
