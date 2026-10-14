import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedWaitProfile } from "./weighted-wait-profile.js";

test("WeightedWaitProfile starts in proposed", () => {
  const item = newWeightedWaitProfile("code-77", "label-547");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedWaitProfile moves to approved", () => {
  const item = newWeightedWaitProfile("code-77", "label-547");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedWaitProfile rejects moves from withdrawn", () => {
  const item = newWeightedWaitProfile("code-77", "label-547");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
