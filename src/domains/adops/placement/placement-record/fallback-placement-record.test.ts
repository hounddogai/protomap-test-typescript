import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPlacementRecord } from "./fallback-placement-record.js";

test("FallbackPlacementRecord starts in open", () => {
  const item = newFallbackPlacementRecord("code-174", "title-588");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPlacementRecord moves to reopened", () => {
  const item = newFallbackPlacementRecord("code-174", "title-588");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("FallbackPlacementRecord rejects moves from archived", () => {
  const item = newFallbackPlacementRecord("code-174", "title-588");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
