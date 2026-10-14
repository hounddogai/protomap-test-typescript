import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditMapping } from "./credit-mapping.js";

test("CreditMapping starts in proposed", () => {
  const item = newCreditMapping("code-102", "name-173");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditMapping moves to rejected", () => {
  const item = newCreditMapping("code-102", "name-173");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("CreditMapping rejects moves from withdrawn", () => {
  const item = newCreditMapping("code-102", "name-173");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
