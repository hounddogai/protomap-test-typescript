import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedOptOutAgreement } from "./weighted-opt-out-agreement.js";

test("WeightedOptOutAgreement starts in open", () => {
  const item = newWeightedOptOutAgreement("code-611", "title-343");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedOptOutAgreement moves to reopened", () => {
  const item = newWeightedOptOutAgreement("code-611", "title-343");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("WeightedOptOutAgreement rejects moves from archived", () => {
  const item = newWeightedOptOutAgreement("code-611", "title-343");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
