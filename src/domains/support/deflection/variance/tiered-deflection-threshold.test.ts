import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredDeflectionThreshold } from "./tiered-deflection-threshold.js";

test("TieredDeflectionThreshold starts in open", () => {
  const item = newTieredDeflectionThreshold("code-49", "label-599");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredDeflectionThreshold moves to resolved", () => {
  const item = newTieredDeflectionThreshold("code-49", "label-599");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("TieredDeflectionThreshold rejects moves from archived", () => {
  const item = newTieredDeflectionThreshold("code-49", "label-599");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
