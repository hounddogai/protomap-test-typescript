import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditCheckpoint } from "./credit-checkpoint.js";

test("CreditCheckpoint starts in new", () => {
  const item = newCreditCheckpoint("code-925", "name-804");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditCheckpoint moves to queued", () => {
  const item = newCreditCheckpoint("code-925", "name-804");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CreditCheckpoint rejects moves from failed", () => {
  const item = newCreditCheckpoint("code-925", "name-804");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
