import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientCreditRecord } from "./lenient-credit-record.js";

test("LenientCreditRecord starts in open", () => {
  const item = newLenientCreditRecord("code-235", "title-398");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientCreditRecord moves to in review", () => {
  const item = newLenientCreditRecord("code-235", "title-398");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LenientCreditRecord rejects moves from archived", () => {
  const item = newLenientCreditRecord("code-235", "title-398");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
