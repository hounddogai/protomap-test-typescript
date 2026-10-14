import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedDeflectionRule } from "./weighted-deflection-rule.js";

test("WeightedDeflectionRule starts in idle", () => {
  const item = newWeightedDeflectionRule("code-318", "name-415");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedDeflectionRule moves to warming", () => {
  const item = newWeightedDeflectionRule("code-318", "name-415");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("WeightedDeflectionRule rejects moves from stopped", () => {
  const item = newWeightedDeflectionRule("code-318", "name-415");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
