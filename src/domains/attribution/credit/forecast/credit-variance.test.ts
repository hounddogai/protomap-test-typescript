import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditVariance } from "./credit-variance.js";

test("CreditVariance starts in requested", () => {
  const item = newCreditVariance("code-291", "title-786");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditVariance moves to granted", () => {
  const item = newCreditVariance("code-291", "title-786");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CreditVariance rejects moves from expired", () => {
  const item = newCreditVariance("code-291", "title-786");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
