import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedActivationLedger } from "./weighted-activation-ledger.js";

test("WeightedActivationLedger starts in open", () => {
  const item = newWeightedActivationLedger("code-201", "title-378");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedActivationLedger moves to resolved", () => {
  const item = newWeightedActivationLedger("code-201", "title-378");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("WeightedActivationLedger rejects moves from archived", () => {
  const item = newWeightedActivationLedger("code-201", "title-378");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
