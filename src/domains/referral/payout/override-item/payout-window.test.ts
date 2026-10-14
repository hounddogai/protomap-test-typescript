import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutWindow } from "./payout-window.js";

test("PayoutWindow starts in draft", () => {
  const item = newPayoutWindow("code-401", "name-566");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutWindow moves to suspended", () => {
  const item = newPayoutWindow("code-401", "name-566");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PayoutWindow rejects moves from closed", () => {
  const item = newPayoutWindow("code-401", "name-566");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
