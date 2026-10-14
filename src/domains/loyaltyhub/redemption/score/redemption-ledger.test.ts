import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionLedger } from "./redemption-ledger.js";

test("RedemptionLedger starts in open", () => {
  const item = newRedemptionLedger("code-989", "name-396");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionLedger moves to reopened", () => {
  const item = newRedemptionLedger("code-989", "name-396");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RedemptionLedger rejects moves from archived", () => {
  const item = newRedemptionLedger("code-989", "name-396");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
