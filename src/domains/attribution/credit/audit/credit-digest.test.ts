import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditDigest } from "./credit-digest.js";

test("CreditDigest starts in open", () => {
  const item = newCreditDigest("code-916", "name-457");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditDigest moves to in review", () => {
  const item = newCreditDigest("code-916", "name-457");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CreditDigest rejects moves from archived", () => {
  const item = newCreditDigest("code-916", "name-457");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
