import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedCsatEntry } from "./batched-csat-entry.js";

test("BatchedCsatEntry starts in planned", () => {
  const item = newBatchedCsatEntry("code-134", "title-856");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedCsatEntry moves to cancelled", () => {
  const item = newBatchedCsatEntry("code-134", "title-856");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("BatchedCsatEntry rejects moves from cancelled", () => {
  const item = newBatchedCsatEntry("code-134", "title-856");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
