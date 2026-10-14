import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditPolicy } from "./credit-policy.js";

test("CreditPolicy starts in requested", () => {
  const item = newCreditPolicy("code-357", "name-248");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditPolicy moves to revoked", () => {
  const item = newCreditPolicy("code-357", "name-248");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("CreditPolicy rejects moves from expired", () => {
  const item = newCreditPolicy("code-357", "name-248");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
