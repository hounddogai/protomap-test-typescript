import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedWaitBaseline } from "./weighted-wait-baseline.js";

test("WeightedWaitBaseline starts in idle", () => {
  const item = newWeightedWaitBaseline("code-414", "title-906");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedWaitBaseline moves to draining", () => {
  const item = newWeightedWaitBaseline("code-414", "title-906");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("WeightedWaitBaseline rejects moves from stopped", () => {
  const item = newWeightedWaitBaseline("code-414", "title-906");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
