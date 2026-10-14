import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedFunnelTarget } from "./weighted-funnel-target.js";

test("WeightedFunnelTarget starts in draft", () => {
  const item = newWeightedFunnelTarget("code-856", "name-945");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedFunnelTarget moves to closed", () => {
  const item = newWeightedFunnelTarget("code-856", "name-945");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("WeightedFunnelTarget rejects moves from closed", () => {
  const item = newWeightedFunnelTarget("code-856", "name-945");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
