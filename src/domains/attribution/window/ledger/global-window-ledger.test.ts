import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalWindowLedger } from "./global-window-ledger.js";

test("GlobalWindowLedger starts in open", () => {
  const item = newGlobalWindowLedger("code-204", "title-579");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalWindowLedger moves to in review", () => {
  const item = newGlobalWindowLedger("code-204", "title-579");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalWindowLedger rejects moves from archived", () => {
  const item = newGlobalWindowLedger("code-204", "title-579");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
