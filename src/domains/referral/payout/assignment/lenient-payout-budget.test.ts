import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPayoutBudget } from "./lenient-payout-budget.js";

test("LenientPayoutBudget starts in idle", () => {
  const item = newLenientPayoutBudget("code-302", "name-866");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPayoutBudget moves to ready", () => {
  const item = newLenientPayoutBudget("code-302", "name-866");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LenientPayoutBudget rejects moves from stopped", () => {
  const item = newLenientPayoutBudget("code-302", "name-866");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
