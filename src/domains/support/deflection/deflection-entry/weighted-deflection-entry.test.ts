import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedDeflectionEntry } from "./weighted-deflection-entry.js";

test("WeightedDeflectionEntry starts in open", () => {
  const item = newWeightedDeflectionEntry("code-362", "label-519");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedDeflectionEntry moves to in review", () => {
  const item = newWeightedDeflectionEntry("code-362", "label-519");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WeightedDeflectionEntry rejects moves from archived", () => {
  const item = newWeightedDeflectionEntry("code-362", "label-519");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
