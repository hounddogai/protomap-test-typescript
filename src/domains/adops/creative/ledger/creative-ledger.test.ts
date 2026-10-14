import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreativeLedger } from "./creative-ledger.js";

test("CreativeLedger starts in planned", () => {
  const item = newCreativeLedger("code-741", "title-366");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreativeLedger moves to completed", () => {
  const item = newCreativeLedger("code-741", "title-366");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("CreativeLedger rejects moves from cancelled", () => {
  const item = newCreativeLedger("code-741", "title-366");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
