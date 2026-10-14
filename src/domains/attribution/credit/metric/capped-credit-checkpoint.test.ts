import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedCreditCheckpoint } from "./capped-credit-checkpoint.js";

test("CappedCreditCheckpoint starts in requested", () => {
  const item = newCappedCreditCheckpoint("code-698", "name-274");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedCreditCheckpoint moves to granted", () => {
  const item = newCappedCreditCheckpoint("code-698", "name-274");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CappedCreditCheckpoint rejects moves from expired", () => {
  const item = newCappedCreditCheckpoint("code-698", "name-274");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
