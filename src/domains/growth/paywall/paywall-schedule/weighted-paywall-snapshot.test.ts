import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPaywallSnapshot } from "./weighted-paywall-snapshot.js";

test("WeightedPaywallSnapshot starts in new", () => {
  const item = newWeightedPaywallSnapshot("code-155", "label-394");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPaywallSnapshot moves to done", () => {
  const item = newWeightedPaywallSnapshot("code-155", "label-394");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("WeightedPaywallSnapshot rejects moves from failed", () => {
  const item = newWeightedPaywallSnapshot("code-155", "label-394");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
