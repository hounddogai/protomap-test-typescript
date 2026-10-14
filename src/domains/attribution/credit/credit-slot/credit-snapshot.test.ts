import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditSnapshot } from "./credit-snapshot.js";

test("CreditSnapshot starts in planned", () => {
  const item = newCreditSnapshot("code-744", "title-688");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditSnapshot moves to scheduled", () => {
  const item = newCreditSnapshot("code-744", "title-688");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CreditSnapshot rejects moves from cancelled", () => {
  const item = newCreditSnapshot("code-744", "title-688");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
