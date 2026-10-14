import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedCreditSlot } from "./weighted-credit-slot.js";

test("WeightedCreditSlot starts in proposed", () => {
  const item = newWeightedCreditSlot("code-870", "name-437");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedCreditSlot moves to withdrawn", () => {
  const item = newWeightedCreditSlot("code-870", "name-437");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("WeightedCreditSlot rejects moves from withdrawn", () => {
  const item = newWeightedCreditSlot("code-870", "name-437");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
