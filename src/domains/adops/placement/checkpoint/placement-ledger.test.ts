import assert from "node:assert/strict";
import { test } from "node:test";
import { newPlacementLedger } from "./placement-ledger.js";

test("PlacementLedger starts in proposed", () => {
  const item = newPlacementLedger("code-178", "name-884");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PlacementLedger moves to rejected", () => {
  const item = newPlacementLedger("code-178", "name-884");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PlacementLedger rejects moves from withdrawn", () => {
  const item = newPlacementLedger("code-178", "name-884");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
