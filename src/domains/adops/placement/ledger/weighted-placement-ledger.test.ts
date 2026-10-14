import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPlacementLedger } from "./weighted-placement-ledger.js";

test("WeightedPlacementLedger starts in draft", () => {
  const item = newWeightedPlacementLedger("code-556", "title-138");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPlacementLedger moves to suspended", () => {
  const item = newWeightedPlacementLedger("code-556", "title-138");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("WeightedPlacementLedger rejects moves from closed", () => {
  const item = newWeightedPlacementLedger("code-556", "title-138");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
